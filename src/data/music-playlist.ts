export type MusicTrack = {
	title: string;
	artist: string;
	src: string;
	cover?: string;
};

export const musicPlaylist: MusicTrack[] = [
	// Put audio files in public/music, then update src to "/music/your-file.mp3".
	// Example:
	// {
	// 	title: "Song Name",
	// 	artist: "Artist",
	// 	src: "/music/song-name.mp3",
	// 	cover: "/music/song-cover.jpg",
	// },
];
