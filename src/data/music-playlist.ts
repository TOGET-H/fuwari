export type MusicTrack = {
	title: string;
	artist: string;
	src: string;
	cover?: string;
};

export const musicPlaylist: MusicTrack[] = [
	// Put audio files in public/music, then update src to "/music/your-file.mp3".
	// Example:
	{
		title: "在雨后醒来",
		artist: "Artist",
		src: "public\\music\\艾志恒Asen - 在雨后醒来(Explicit).mp3",
		cover: "public\\music\\花.png",
	},
];
