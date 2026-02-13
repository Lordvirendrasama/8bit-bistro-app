export type VideoPlaylistItem = {
  id: string;
  title: string;
  src: string;
};

// Add your video files to the `public/videos` directory
// and then reference them here.
export const videoPlaylist: VideoPlaylistItem[] = [
  {
    id: 'vid1',
    title: 'Retro Wave Drive',
    src: '/videos/video1.mp4',
  },
  {
    id: 'vid2',
    title: 'Arcade Dreams',
    src: '/videos/video2.mp4',
  },
  {
    id: 'vid3',
    title: 'Neon Grid',
    src: '/videos/video3.mp4',
  },
];
