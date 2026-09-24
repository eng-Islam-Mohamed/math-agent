export function textDirection(text: string): "rtl" | "ltr" {
  return /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u.test(text) ? "rtl" : "ltr";
}
