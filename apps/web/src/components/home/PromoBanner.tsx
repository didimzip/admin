import Image from "next/image";

export default function PromoBanner() {
  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-r from-[#1a1a1a] to-[#333] flex items-center justify-between px-8 py-5 my-2">
      <div className="flex-1">
        <p className="text-xs text-white/60">디딤집 알아보기</p>
        <h3 className="text-white font-bold mt-1">
          디딤집을 더 유용하게 활용하는 맞춤 가이드 한 번 확인해보세요!
        </h3>
      </div>
      <div className="relative w-40 h-20 ml-4 rounded-lg overflow-hidden shrink-0">
        <Image
          src="https://images.unsplash.com/photo-1553484771-047a44eee27b?w=400&q=80"
          alt="가이드"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}
