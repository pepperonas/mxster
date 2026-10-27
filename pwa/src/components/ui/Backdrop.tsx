/**
 * The background: a huge record cut off at the bottom right, drawn only as its
 * grooves. A soft sheen sweeps over them slowly; while a song plays
 * (`html[data-playing]`, see useBackdropPlaying) it turns at record speed and a
 * warm glow breathes at the centre. Pure CSS — only transform and opacity move.
 */
export function Backdrop() {
  return (
    <div className="mx-backdrop" aria-hidden="true">
      <div className="mx-backdrop-disc">
        <div className="mx-backdrop-grooves" />
        <div className="mx-backdrop-sheen" data-speed="idle" />
        <div className="mx-backdrop-sheen" data-speed="play" />
        <div className="mx-backdrop-glow" />
      </div>
    </div>
  )
}
