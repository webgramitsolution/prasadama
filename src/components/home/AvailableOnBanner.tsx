export function AvailableOnBanner() {
  return (
    <div className="w-full my-[5px] rounded-xl overflow-hidden">
      <img
        src="https://ik.imagekit.io/4hcna271xz/avialble%20on.png"
        alt="Prasadam — A Divine Taste, blessed offerings available on all major platforms"
        loading="lazy"
        decoding="async"
        className="hidden md:block w-full h-auto object-contain"
      />
      <img
        src="https://ik.imagekit.io/4hcna271xz/available.png"
        alt="Prasadam — A Divine Taste, blessed offerings available on all major platforms"
        loading="lazy"
        decoding="async"
        className="block md:hidden w-full h-auto object-contain"
      />
    </div>
  );
}
