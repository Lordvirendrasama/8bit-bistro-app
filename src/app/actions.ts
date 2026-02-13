"use server";

import { revalidatePath } from "next/cache";
import { db, storage } from "@/lib/firebase";
import {
  doc,
  setDoc,
  serverTimestamp,
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { z } from "zod";
import type { Player, ScoreStatus } from "@/types";
import {
  proactiveFraudDetectionForScoreSubmissions,
  type ProactiveFraudDetectionInput,
} from "@/ai/flows/proactive-fraud-detection-for-score-submissions-flow";
import { adminScoreImageVerificationAssistant } from "@/ai/flows/admin-score-image-verification-assistant";

const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  instagram: z.string().optional(),
  groupSize: z.coerce.number().int().min(1),
});

export async function registerPlayer(playerData: z.infer<typeof playerSchema>) {
  const validation = playerSchema.safeParse(playerData);

  if (!validation.success) {
    throw new Error(validation.error.message);
  }

  const { id, ...data } = validation.data;

  try {
    await setDoc(doc(db, "players", id), {
      ...data,
      createdAt: serverTimestamp(),
    });

    revalidatePath("/");
    revalidatePath("/dashboard");

    return { success: true, message: "Player registered successfully." };
  } catch (error) {
    console.error("Error registering player:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      message: `Failed to register player: ${errorMessage}`,
    };
  }
}

const scoreFormSchema = z.object({
  playerId: z.string(),
  gameName: z.string().min(1, "Please select a game."),
  scoreValue: z.coerce.number().int().min(0, "Score must be a positive number."),
});

export async function submitScore(prevState: any, formData: FormData) {
  const validatedFields = scoreFormSchema.safeParse({
    playerId: formData.get("playerId"),
    gameName: formData.get("gameName"),
    scoreValue: formData.get("scoreValue"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Submit Score.",
    };
  }

  const { playerId, gameName, scoreValue } = validatedFields.data;
  const imageFile = formData.get("image") as File;

  if (!imageFile || imageFile.size === 0) {
    return {
      errors: { image: ["Image proof is required."] },
      message: "Image proof is required.",
    };
  }

  try {
    // 1. Upload image to Firebase Storage
    const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
    const storageRef = ref(
      storage,
      `score_proofs/${playerId}_${Date.now()}_${imageFile.name}`
    );
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: imageFile.type,
    });
    const imageURL = await getDownloadURL(snapshot.ref);

    // 2. Gather context for AI Fraud Detection
    const playerDoc = await getDoc(doc(db, "players", playerId));
    if (!playerDoc.exists()) throw new Error("Player not found");
    const playerData = playerDoc.data() as Omit<Player, "id">;

    const scoresQuery = query(
      collection(db, "scores"),
      where("playerId", "==", playerId),
      where("gameName", "==", gameName),
      orderBy("timestamp", "asc")
    );
    const scoresSnapshot = await getDocs(scoresQuery);
    const previousScores = scoresSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        scoreValue: data.scoreValue,
        timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
      };
    });

    if (previousScores.length >= 5) {
      return {
        success: false,
        message: `Submission limit of 5 reached for ${gameName}.`,
      };
    }

    // 3. Call proactive fraud detection AI
    const aiInput: ProactiveFraudDetectionInput = {
      currentSubmission: {
        playerId,
        gameName,
        scoreValue,
        imageURL,
        timestamp: new Date().toISOString(),
      },
      playerContext: {
        name: playerData.name,
        instagram: playerData.instagram,
      },
      previousScoresByPlayerForGame: previousScores,
    };
    const aiResult = await proactiveFraudDetectionForScoreSubmissions(aiInput);

    // 4. Save score to Firestore
    const scoreData = {
      playerId,
      gameName,
      scoreValue,
      imageURL,
      status: "pending" as const,
      timestamp: serverTimestamp(),
      isSuspicious: aiResult.isSuspicious,
      suspicionReason: aiResult.reason,
    };

    await addDoc(collection(db, "scores"), scoreData);

    revalidatePath("/admin/dashboard");
    revalidatePath("/leaderboard");

    return { success: true, message: "Score submitted for approval!" };
  } catch (error) {
    console.error("Error submitting score:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: `Failed to submit score: ${errorMessage}` };
  }
}

export async function updateScoreStatus(scoreId: string, status: ScoreStatus) {
  try {
    await updateDoc(doc(db, "scores", scoreId), { status });
    revalidatePath("/admin/dashboard");
    revalidatePath("/leaderboard");
    return { success: true, message: `Score status updated to ${status}.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to update status: ${message}` };
  }
}

export async function updateScoreValue(scoreId: string, scoreValue: number) {
  try {
    await updateDoc(doc(db, "scores", scoreId), { scoreValue });
    revalidatePath("/admin/dashboard");
    revalidatePath("/leaderboard");
    return { success: true, message: "Score value updated." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to update score: ${message}` };
  }
}

export async function deleteScore(scoreId: string) {
  try {
    await deleteDoc(doc(db, "scores", scoreId));
    revalidatePath("/admin/dashboard");
    revalidatePath("/leaderboard");
    return { success: true, message: "Score deleted." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to delete score: ${message}` };
  }
}

export async function verifyScoreAI(scoreId: string) {
  try {
    const scoreDoc = await getDoc(doc(db, "scores", scoreId));
    if (!scoreDoc.exists()) throw new Error("Score not found");

    const score = scoreDoc.data();
    const { imageURL, scoreValue, gameName } = score;

    const response = await fetch(imageURL);
    if (!response.ok) throw new Error("Failed to fetch image from storage.");

    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const photoDataUri = `data:${mimeType};base64,${imageBase64}`;

    const aiResult = await adminScoreImageVerificationAssistant({
      photoDataUri,
      enteredScore: scoreValue,
      gameName,
    });

    return { success: true, data: aiResult };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `AI verification failed: ${message}` };
  }
}

export async function addGame(name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false, message: "Game name cannot be empty." };
  }
  try {
    await addDoc(collection(db, "games"), {
      name,
      isActive: true,
    });
    revalidatePath("/admin/games");
    revalidatePath("/submit-score");
    return { success: true, message: `Game '${name}' added.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to add game: ${message}` };
  }
}

export async function deleteGame(gameId: string) {
  try {
    await deleteDoc(doc(db, "games", gameId));
    revalidatePath("/admin/games");
    revalidatePath("/submit-score");
    revalidatePath("/leaderboard");
    return { success: true, message: "Game deleted." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Failed to delete game: ${message}` };
  }
}
