#!/usr/bin/env python3
"""Turn the generated stage art into the rig's four transparent, aligned WebPs.

    python3 tools/build-rig.py            # art/*.png -> img/apex-rig-*.webp
    python3 tools/build-rig.py --check    # measure and report, write nothing

The generator hands back a full-bleed PNG: the figure sits on a flat near-black
field, at whatever canvas size that run happened to use (the four current stages
came back 1844x2304 and 1122x1402), with a small watermark in a corner. The page
needs the opposite of all three - a transparent cut-out, one shared 900x1125
frame, nothing in the corners - because the four stages stack in the same box and
cross-fade into each other. Anything that moves between them reads as the lion
jumping.

Three passes, in order:

  cut     the field is flooded from the border, so it takes the background and
          NOT the dark pixels inside the figure (the eyes, the joint shadows,
          the near-black outlines) which are nowhere near the border
  clean   of what is left, only the blob holding the figure survives, which is
          what drops the generator's corner watermark - no mask to maintain, and
          it keeps working wherever the next run decides to put the mark
  place   every stage is placed by its BODY, never by the canvas or the head.
          The canvas is just how big that run's export happened to be, and the
          head is meant to disagree - stage 2's mane is drawn larger than stage
          1's skull, which is the point of the sequence. The feet are not: they
          are the same drawing in all four, so the anchor is the floor line and
          the centre between the feet, measured off the silhouette.

Nothing is stretched and nothing is rescaled. Measured on the four current
stages, the feet land within 3px of each other with no scaling at all - the
right foot's inner toe starts on the same column in every one - so the placement
is a whole-pixel translation onto one anchor and no more. --check prints that
measurement for each stage; if a new stage shows up needing real scaling, its
feet span and its body overlap fall out of line here, and it is worth
regenerating the art rather than papering over it with a resize.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

W, H = 900, 1125                       # the frame the page draws (.rig is aspect-ratio 4/5)
FIELD = 70                             # colour distance that still counts as "the flat field"
STAGES = ["apex-rig-1-body", "apex-rig-2-brain", "apex-rig-3-face", "apex-rig-5-alive"]
REF = "apex-rig-3-face"                # the calm armoured stage: every effect is positioned against it
BODY = (0.56, 1.00)                    # the band the overlap is REPORTED on, as a fraction of figure height:
#                                        belt to floor. Above it the mane and the shoulders are allowed
#                                        to differ - that difference is the whole point of the sequence.


def cut(path):
    """RGB art on a flat field -> (image, figure mask). Field flooded from the
    border; then every blob but the figure's is dropped."""
    im = Image.open(path).convert("RGB")
    w, h = im.size
    flood = im.copy()
    MARK = (255, 0, 255)
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
                 (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        ImageDraw.floodfill(flood, seed, MARK, thresh=FIELD)
    a = np.array(flood)
    fg = ~((a[..., 0] == 255) & (a[..., 1] == 0) & (a[..., 2] == 255))

    # .copy(): Image.fromarray hands back a read-only view of the numpy buffer,
    # and floodfill then writes into it silently doing nothing.
    blobs = Image.fromarray((fg * 255).astype(np.uint8), "L").copy()
    ys, xs = np.nonzero(fg)
    sy = int(ys.min() + 0.55 * (ys.max() - ys.min()))     # a row through the torso
    row = np.nonzero(fg[sy])[0]
    sx = int((row.min() + row.max()) // 2)
    if not fg[sy, sx]:                                    # the midpoint fell in the gap beside an arm
        sx = int(np.median(row))
    ImageDraw.floodfill(blobs, (sx, sy), 128, thresh=10)
    figure = np.array(blobs) == 128
    return im, fg, figure


def to_frame(im, mask):
    """Cut-out, uniformly scaled into the frame and centred. One scale for both
    axes - the frame and the source are both 4:5, so nothing is cropped."""
    a = np.dstack([np.array(im), (mask * 255).astype(np.uint8)]).astype(np.float32)
    al = a[..., 3:4] / 255.0
    a[..., :3] *= al                                      # premultiply: straight RGBA drags the
    src = Image.fromarray(a.astype(np.uint8))             # field's black into every edge
    s = min(W / im.width, H / im.height)
    out = src.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.paste(out, ((W - out.width) // 2, (H - out.height) // 2))
    return canvas                                          # still premultiplied


def unpremultiply(img):
    a = np.array(img).astype(np.float32)
    al = a[..., 3:4] / 255.0
    a[..., :3] = np.where(al > 0, np.clip(a[..., :3] / np.maximum(al, 1e-6), 0, 255), 0)
    return Image.fromarray(a.astype(np.uint8))


def shifted(img, dx, dy):
    """Whole-pixel translation in the frame. Premultiplied in, premultiplied out."""
    if dx == 0 and dy == 0:
        return img
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.paste(img, (int(dx), int(dy)))
    return out


def alpha(img):
    return np.array(img)[..., 3] > 110


def band(mask):
    """The scoring band: BODY, as a fraction of THIS figure's own height."""
    ys = np.nonzero(mask.any(1))[0]
    top, bot = ys.min(), ys.max()
    hgt = bot - top + 1
    m = np.zeros_like(mask)
    m[top + int(BODY[0] * hgt): top + int(BODY[1] * hgt) + 1] = True
    return m


def iou(a, b, region):
    a, b = a & region, b & region
    u = (a | b).sum()
    return float((a & b).sum() / u) if u else 0.0


def landmarks(mask):
    """The anchor and the numbers that prove it. The tail swings out to one side
    and the mane's height is a per-stage decision, so neither the silhouette's
    centre nor its top can be the anchor - the feet can."""
    ys, xs = np.nonzero(mask)
    top, bot = int(ys.min()), int(ys.max())
    hgt = bot - top + 1
    feet = mask[bot - int(0.05 * hgt): bot + 1]
    fx = np.nonzero(feet.any(0))[0]
    return dict(top=top, floor=bot, left=int(xs.min()), right=int(xs.max()),
                feetL=int(fx.min()), feetR=int(fx.max()),
                feetCx=float((fx.min() + fx.max()) / 2), feetW=int(fx.max() - fx.min() + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="art", help="folder holding the generated apex-rig-*.png")
    ap.add_argument("--out", default="img")
    ap.add_argument("--check", action="store_true", help="measure and report, write nothing")
    ap.add_argument("--quality", type=int, default=86)
    args = ap.parse_args()
    src, out = Path(args.src), Path(args.out)

    framed, dropped = {}, {}
    for n in STAGES:
        p = src / f"{n}.png"
        if not p.exists():
            sys.exit(f"missing {p} - put the generated PNGs in {src}/")
        im, fg, figure = cut(p)
        framed[n] = to_frame(im, figure)
        dropped[n] = int(fg.sum() - figure.sum())
        print(f"cut  {n:20} {im.width}x{im.height}  figure {figure.sum():>9} px"
              f"  dropped {dropped[n]:>6} px (watermark + specks)")

    ref = landmarks(alpha(framed[REF]))
    ref_mask = alpha(framed[REF])
    region = band(ref_mask)
    print(f"\nplace  anchor: the feet. Reference {REF} - floor y={ref['floor']}, "
          f"feet centre x={ref['feetCx']:.1f}, feet span {ref['feetW']}px")
    print(f"{'stage':22}{'dx':>5}{'dy':>5}{'feet span':>11}{'body overlap':>14}{'whole figure':>14}")
    placed, warn = {}, []
    for n in STAGES:
        m = landmarks(alpha(framed[n]))
        dx, dy = round(ref["feetCx"] - m["feetCx"]), ref["floor"] - m["floor"]
        placed[n] = shifted(framed[n], dx, dy)
        body = iou(alpha(placed[n]), ref_mask, region)
        whole = iou(alpha(placed[n]), ref_mask, np.ones_like(ref_mask))
        span = m["feetW"] / ref["feetW"]
        print(f"{n:22}{dx:5}{dy:5}{m['feetW']:8}{span:+7.0%}{body:14.3f}{whole:14.3f}")
        if abs(dx) > 12 or abs(dy) > 12 or not 0.9 < span < 1.1 or body < 0.6:
            warn.append(n)

    print(f"\n{'stage':22}{'bbox x':>14}{'bbox y':>14}{'floor':>8}{'feet cx':>10}")
    for n in STAGES:
        m = landmarks(alpha(placed[n]))
        print(f"{n:22}{f'[{m["left"]},{m["right"]}]':>14}{f'[{m["top"]},{m["floor"]}]':>14}"
              f"{m['floor']:8}{m['feetCx']:10.1f}")
    if warn:
        print("\n!! drifted, regenerate rather than accept: " + ", ".join(warn))

    if args.check:
        return
    out.mkdir(exist_ok=True)
    for n in STAGES:
        unpremultiply(placed[n]).save(out / f"{n}.webp", quality=args.quality, method=6)
        print(f"wrote {out / f'{n}.webp'}  {(out / f'{n}.webp').stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
