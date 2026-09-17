#!/usr/bin/env python3
"""Lock the assembly rig's stages onto one head, so they cross-fade as one figure.

    python3 tools/align-rig.py            # align img/apex-rig-*.webp in place
    python3 tools/align-rig.py --check    # measure only, write nothing

The art is generated per stage and never comes back the same size: the heads
measured 384-472px wide, sitting up to 100px apart, which is why the lion
appeared to zoom and slide between steps. Each stage is a complete drawing, so
the only honest fix is a uniform scale plus a translation - one that puts every
head in the same place at the same size. Nothing is stretched.

How a stage is measured, from its alpha silhouette alone (the art has no
metadata and colour masks miss the mane's shaded side):

  head   the widest run of rows in the top 45% of the figure, cut off at the
         neck - the first row below that peak where the silhouette has narrowed
         to 85% and starts widening again into the shoulders
  scale  matched on the head box's DIAGONAL, so a mane that is rounder than the
         rest (the skull stage) splits the difference between width and height
         instead of matching one and missing the other
  place  the head box's centre goes to one point on the canvas, for every stage;
         the skeleton, having no head, puts its shoulder point where the
         reference stage's shoulder point lands

The bare skeleton has no head. It is matched on body length instead - shoulder
line to floor, which measures within 1% of the armoured stage - and it puts its
own shoulder point where the reference stage's shoulder point lands, so the two
share a shoulder line and a floor.

Run it again and nothing moves relative to anything else: every stage is
re-measured and re-placed together, so the group may re-centre in the canvas by
a few pixels, but the heads stay locked to each other.

What this CANNOT fix: the bodies. Once the heads agree, each stage's body is
whatever the generator drew relative to that head, and they disagree by up to
20% (the skull stage's body is the worst). Only new art fixes that; see the
README for the prompt and the reference frame to generate it against.
"""
import argparse, json, math, sys
from pathlib import Path

import numpy as np
from PIL import Image

W, H = 900, 1125
NECK_OFF = 184.0           # head centre -> neck line, averaged over the maned stages
STAGES = ["apex-rig-1-body", "apex-rig-2-brain", "apex-rig-3-face", "apex-rig-4-limbs", "apex-rig-5-alive"]
HEADLESS = "apex-rig-1-body"
REF = "apex-rig-3-face"    # smallest head: every other stage scales DOWN, so nothing is upscaled


def widths(mask):
    """Silhouette width, left and right edge, per row."""
    w = np.zeros(mask.shape[0], int)
    lo = np.zeros(mask.shape[0], int)
    hi = np.zeros(mask.shape[0], int)
    for y in range(mask.shape[0]):
        xs = np.nonzero(mask[y])[0]
        if len(xs):
            lo[y], hi[y], w[y] = xs.min(), xs.max(), xs.max() - xs.min() + 1
    return w, lo, hi


def measure(img, name):
    a = np.array(img)
    soft = a[..., 3] > 60      # the whole figure, aura included
    hard = a[..., 3] > 200     # opaque only: the glow and the skill.md text don't count as body
    w, lo, hi = widths(soft)
    wo, loo, hio = widths(hard)
    rows = np.nonzero(soft.any(1))[0]
    top, bot = int(rows.min()), int(rows.max())
    d = {"top": top, "bot": bot}
    feet = int(np.nonzero(wo)[0].max())
    if name == HEADLESS:
        # its shoulders are where the silhouette jumps from the neck stub to the ribcage
        wide = wo[top:top + 300].max()
        shoulder = next(y for y in range(top, top + 300) if wo[y] >= wide * 0.5)
        d.update(kind="skeleton", shoulderY=shoulder, shoulderW=int(wo[shoulder]),
                 shoulderCx=float((loo[shoulder] + hio[shoulder]) / 2), feet=feet)
        return d
    smooth = np.convolve(w, np.ones(15) / 15, mode="same")
    peak = int(np.argmax(smooth[top:top + int((bot - top) * 0.45)]) + top)
    neck = next((y for y in range(peak, min(bot, peak + 340))
                 if smooth[y] < 0.85 * smooth[peak] and smooth[y] <= smooth[min(y + 8, bot)]), peak + 200)
    ys, xs = np.nonzero(soft[top:neck + 1])
    # The shoulder line IS the neck row here: the mane ends where the shoulders begin.
    # Don't look for "the widest row below the head" - arms and legs keep widening
    # downwards, so that lands on the hips.
    d.update(kind="maned", neck=int(neck), headW=int(xs.max() - xs.min() + 1), headH=int(neck - top + 1),
             cx=float((xs.min() + xs.max()) / 2), cy=float((top + neck) / 2),
             shoulderY=int(neck), shoulderW=int(wo[neck]),
             shoulderCx=float((loo[neck] + hio[neck]) / 2), feet=feet)
    return d


def resized(img, scale):
    """Premultiply before resampling: straight RGBA drags the transparent pixels'
    black into every edge, and this art is all edges."""
    a = np.array(img).astype(np.float32)
    alpha = a[..., 3:4] / 255.0
    a[..., :3] *= alpha
    out = Image.fromarray(a.astype(np.uint8)).resize(
        (max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.LANCZOS)
    a = np.array(out).astype(np.float32)
    alpha = a[..., 3:4] / 255.0
    a[..., :3] = np.where(alpha > 0, np.clip(a[..., :3] / np.maximum(alpha, 1e-6), 0, 255), 0)
    return Image.fromarray(a.astype(np.uint8))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="img")
    ap.add_argument("--check", action="store_true", help="measure and report, write nothing")
    ap.add_argument("--quality", type=int, default=82)
    args = ap.parse_args()
    d = Path(args.dir)

    src = {}
    for n in STAGES:
        p = d / f"{n}.webp"
        if not p.exists():
            sys.exit(f"missing {p}")
        src[n] = Image.open(p).convert("RGBA")
    M = {n: measure(src[n], n) for n in STAGES}

    ref_diag = math.hypot(M[REF]["headW"], M[REF]["headH"])
    for n, m in M.items():
        m["scale"] = (ref_diag / math.hypot(m["headW"], m["headH"])) if m["kind"] == "maned" \
            else (M[REF]["feet"] - M[REF]["shoulderY"]) / (m["feet"] - m["shoulderY"])   # body length: shoulders to floor

    # Aligned space: the reference at scale 1, its head centre at the origin. A maned
    # stage puts its own head centre there. The skeleton has none, so it puts its
    # shoulder point where the reference's shoulder point lands - same shoulder line,
    # same floor, since their torsos measure the same.
    r = M[REF]
    ref_shoulder = (r["shoulderCx"] - r["cx"], r["shoulderY"] - r["cy"])   # in aligned space
    anchor, target = {}, {}
    for n, m in M.items():
        if m["kind"] == "maned":
            anchor[n], target[n] = (m["cx"], m["cy"]), (0.0, 0.0)
        else:
            anchor[n], target[n] = (m["shoulderCx"], m["shoulderY"]), ref_shoulder

    ext = {}
    for n, m in M.items():
        ys, xs = np.nonzero(np.array(src[n])[..., 3] > 60)
        ax, ay = anchor[n]
        tx, ty = target[n]
        s = m["scale"]
        ext[n] = dict(l=(ax - xs.min()) * s - tx, r=(xs.max() - ax) * s + tx,
                      t=(ay - ys.min()) * s - ty, b=(ys.max() - ay) * s + ty)
    uL, uR = (max(e[k] for e in ext.values()) for k in ("l", "r"))
    uT, uB = (max(e[k] for e in ext.values()) for k in ("t", "b"))
    k = min(1.0, W * 0.97 / (uL + uR), H * 0.97 / (uT + uB))   # never upscale past the source art
    Cx = (W - (uL + uR) * k) / 2 + uL * k
    Cy = (H - (uT + uB) * k) / 2 + uT * k

    print(f"reference {REF}  fit {k:.4f}  head centre ({Cx:.0f}, {Cy:.0f})")
    print(f"{'stage':20} {'scale':>7} {'headW':>6} {'headH':>6} {'offset':>14}")
    plan = {}
    for n, m in M.items():
        s = m["scale"] * k
        ax, ay = anchor[n]
        tx, ty = target[n]
        ox, oy = round(Cx + tx * k - ax * s), round(Cy + ty * k - ay * s)
        plan[n] = dict(scale=round(s, 4), ox=ox, oy=oy)
        print(f"{n:20} {s:7.4f} {m.get('headW', 0):6} {m.get('headH', 0):6} {f'({ox}, {oy})':>14}")

    if args.check:
        print(json.dumps(M, indent=1, default=float))
        return

    for n, p in plan.items():
        out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        out.alpha_composite(resized(src[n], p["scale"]), (p["ox"], p["oy"]))
        out.save(d / f"{n}.webp", quality=args.quality, method=6)

    after = {n: measure(Image.open(d / f"{n}.webp").convert("RGBA"), n) for n in STAGES if n != HEADLESS}
    print("\nafter — the heads that have to agree:")
    for n, m in after.items():
        print(f"  {n:20} headW={m['headW']:4} headH={m['headH']:4} centre=({m['cx']:.1f}, {m['cy']:.1f}) neck={m['neck']}")


if __name__ == "__main__":
    main()
