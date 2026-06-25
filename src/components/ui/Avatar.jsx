// Ảnh đại diện khách hàng dùng chung: có ảnh thì hiện ảnh, không thì hiện chữ cái đầu trên nền gradient.
export default function Avatar({ src, name, size = 36, rounded = "full", className = "" }) {
  const style = { width: size, height: size };
  const radius = rounded === "full" ? "rounded-full" : "rounded-2xl";
  if (src) {
    return <img src={src} alt="" style={style} className={`${radius} object-cover shrink-0 ${className}`} />;
  }
  return (
    <span
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      className={`${radius} bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center font-bold shrink-0 ${className}`}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </span>
  );
}
