<script lang="ts">
import Icon from "@iconify/svelte";
import { musicPlaylist } from "@/data/music-playlist";
import { onDestroy } from "svelte";

const tracks = musicPlaylist;

let audio: HTMLAudioElement | null = null;
let activeIndex = 0;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let volume = 0.45;
let errorMessage = "";

$: activeTrack = tracks[activeIndex];
$: hasTracks = tracks.length > 0;
$: progress = duration > 0 ? (currentTime / duration) * 100 : 0;

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds)) return "0:00";

	const minutes = Math.floor(seconds / 60);
	const rest = Math.floor(seconds % 60)
		.toString()
		.padStart(2, "0");
	return `${minutes}:${rest}`;
}

function bindAudio(node: HTMLAudioElement) {
	audio = node;
	audio.volume = volume;
}

async function play() {
	if (!audio || !activeTrack) return;

	try {
		errorMessage = "";
		await audio.play();
		isPlaying = true;
	} catch {
		isPlaying = false;
		errorMessage = "音频无法播放，请检查文件路径";
	}
}

function pause() {
	audio?.pause();
	isPlaying = false;
}

function toggle() {
	if (!hasTracks) return;

	if (isPlaying) {
		pause();
	} else {
		void play();
	}
}

function switchTrack(direction: number) {
	if (!hasTracks) return;

	const wasPlaying = isPlaying;
	pause();
	activeIndex = (activeIndex + direction + tracks.length) % tracks.length;
	currentTime = 0;
	duration = 0;
	errorMessage = "";

	if (audio) {
		audio.load();
	}

	if (wasPlaying) {
		setTimeout(() => void play(), 0);
	}
}

function updateProgress() {
	if (!audio) return;
	currentTime = audio.currentTime;
	duration = audio.duration || 0;
}

function seek(event: Event) {
	if (!audio || !duration) return;

	const value = Number((event.target as HTMLInputElement).value);
	audio.currentTime = (value / 100) * duration;
	currentTime = audio.currentTime;
}

function updateVolume() {
	if (audio) {
		audio.volume = volume;
	}
}

function handleEnded() {
	switchTrack(1);
}

function handleError() {
	isPlaying = false;
	errorMessage = "音频文件未找到";
}

onDestroy(() => {
	pause();
	audio = null;
});
</script>

<div class="card-base music-player p-4">
	{#if hasTracks}
		<audio
			bind:this={bindAudio}
			src={activeTrack.src}
			preload="metadata"
			on:timeupdate={updateProgress}
			on:loadedmetadata={updateProgress}
			on:ended={handleEnded}
			on:error={handleError}
		></audio>

		<div class="mb-3 flex items-start gap-3">
			<div class="cover-box">
				{#if activeTrack.cover}
					<img src={activeTrack.cover} alt={activeTrack.title} />
				{:else}
					<Icon icon="material-symbols:music-note-rounded" />
				{/if}
			</div>

			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2 text-sm font-bold text-90">
					<Icon icon="material-symbols:graphic-eq-rounded" class="text-lg text-[var(--primary)]" />
					<span>音乐播放</span>
				</div>
				<div class="mt-2 truncate text-base font-bold text-90">{activeTrack.title}</div>
				<div class="truncate text-xs text-50">{activeTrack.artist}</div>
			</div>
		</div>

		<input
			aria-label="播放进度"
			class="progress-slider mb-2"
			type="range"
			min="0"
			max="100"
			step="0.1"
			value={progress}
			on:input={seek}
		/>

		<div class="mb-4 flex justify-between font-mono text-[0.7rem] text-50">
			<span>{formatTime(currentTime)}</span>
			<span>{formatTime(duration)}</span>
		</div>

		<div class="mb-4 flex items-center justify-between gap-2">
			<button class="control-btn" type="button" aria-label="上一首" on:click={() => switchTrack(-1)}>
				<Icon icon="material-symbols:skip-previous-rounded" />
			</button>
			<button class="play-btn" type="button" aria-label={isPlaying ? "暂停" : "播放"} on:click={toggle}>
				<Icon icon={isPlaying ? "material-symbols:pause-rounded" : "material-symbols:play-arrow-rounded"} />
			</button>
			<button class="control-btn" type="button" aria-label="下一首" on:click={() => switchTrack(1)}>
				<Icon icon="material-symbols:skip-next-rounded" />
			</button>
		</div>

		<div class="flex items-center gap-2 text-50">
			<Icon icon="material-symbols:volume-down-rounded" class="text-lg" />
			<input
				aria-label="音量"
				class="volume-slider"
				type="range"
				min="0"
				max="1"
				step="0.01"
				bind:value={volume}
				on:input={updateVolume}
			/>
		</div>

		{#if errorMessage}
			<div class="mt-3 rounded-md bg-black/[0.04] px-3 py-2 text-xs text-50 dark:bg-white/[0.06]">
				{errorMessage}
			</div>
		{/if}
	{:else}
		<div class="flex items-center gap-2 text-sm font-bold text-90">
			<Icon icon="material-symbols:library-music-outline-rounded" class="text-lg text-[var(--primary)]" />
			<span>音乐播放</span>
		</div>
		<div class="mt-3 rounded-md border border-dashed border-black/10 px-3 py-3 text-sm leading-6 text-75 dark:border-white/10">
			把音乐文件放到 <span class="font-mono text-[var(--primary)]">public/music</span>，然后在
			<span class="font-mono text-[var(--primary)]">src/data/music-playlist.ts</span> 里添加歌曲。
		</div>
	{/if}
</div>

<style>
	.music-player {
		border: 1px solid rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .music-player {
		border-color: rgba(255, 255, 255, 0.05);
	}

	.cover-box {
		display: flex;
		width: 3.4rem;
		height: 3.4rem;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 0.55rem;
		background: var(--btn-regular-bg);
		color: var(--primary);
		font-size: 1.8rem;
	}

	.cover-box img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.control-btn,
	.play-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.control-btn {
		width: 2.4rem;
		height: 2.4rem;
		color: var(--primary);
		background: var(--btn-regular-bg);
		font-size: 1.6rem;
	}

	.play-btn {
		width: 3rem;
		height: 3rem;
		color: white;
		background: var(--primary);
		font-size: 2rem;
	}

	.control-btn:hover,
	.play-btn:hover {
		transform: translateY(-1px);
	}

	.control-btn:active,
	.play-btn:active {
		transform: scale(0.94);
	}

	.progress-slider,
	.volume-slider {
		width: 100%;
		accent-color: var(--primary);
	}
</style>
