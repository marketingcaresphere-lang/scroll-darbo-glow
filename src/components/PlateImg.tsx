// Height-fit "plate" image: sized to the viewport height on desktop (sides
// extended by a blurred copy of the same image), fit to the viewport width on
// narrow screens. Breakpoint crops are switched with <picture>, never by CSS
// scaling, so no breakpoint ever crops the subject.
export type PlateSet = { d: string; t: string; m: string; ad: number };

export const plate = (d: string, t: string, m: string, ad: number): PlateSet => ({ d, t, m, ad });

export function PlateImg({
  p,
  alt,
  className,
  style,
  ariaHidden,
  eager,
}: {
  p: PlateSet;
  alt: string;
  className?: string;
  style?: CSSProperties;
  ariaHidden?: boolean;
  eager?: boolean;
}) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={p.m} />
      <source media="(max-width: 1023px)" srcSet={p.t} />
      <img
        src={p.d}
        alt={ariaHidden ? "" : alt}
        aria-hidden={ariaHidden ? true : undefined}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={className}
        style={style}
      />
    </picture>
  );
}

type CSSProperties = import("react").CSSProperties;
