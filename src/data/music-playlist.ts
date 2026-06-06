export type MusicTrack = {
	title: string;
	artist: string;
	src: string;
	cover?: string;
};

export const musicPlaylist: MusicTrack[] = [
	{
		title: "在雨后醒来",
		artist: "艾志恒Asen",
		src: "/music/艾志恒Asen - 在雨后醒来(Explicit).mp3",
		cover: "/music/花.png",
	},
	{
		title: "爱错",
		artist: "王力宏",
		src: "/music/王力宏-爱错.mp3",
		cover: "/music/花.png",
	},
	{
		title: "你若成风",
		artist: "许嵩",
		src: "/music/许嵩 - 你若成风.mp3",
		cover: "/music/花.png",
	},
	{
		title: "灰色头像",
		artist: "许嵩",
		src: "/music/许嵩-灰色头像.mp3",
		cover: "/music/花.png",
	},
];
