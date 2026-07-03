import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#fafafa] border-t border-border mt-8">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-lg mb-4">DidimZip</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                (주)몬데인컨설팅 · 대표자: 임영철 · 사업자등록번호:
                281-87-02006
              </p>
              <p>주소: 서울특별시 강남구 봉은사 24길 11, 3F</p>
              <p>
                고객지원 문의: help@didimzip.co.kr
              </p>
              <p>
                고객지원: 실시간 채팅 또는 전화 상담 평일 9:00-17:30(서비스문의
                1234-1234 / 기능문의 1234-1234)
              </p>
            </div>
          </div>

          <div className="flex gap-8 text-sm">
            <div className="space-y-2">
              <Link
                href="/terms"
                className="block text-muted-foreground hover:text-foreground"
              >
                서비스 이용약관
              </Link>
              <Link
                href="/privacy"
                className="block text-muted-foreground hover:text-foreground"
              >
                개인정보처리방침
              </Link>
            </div>
            <div className="space-y-2">
              <Link
                href="/policy"
                className="block text-muted-foreground hover:text-foreground"
              >
                운영정책
              </Link>
              <Link
                href="/about"
                className="block text-muted-foreground hover:text-foreground"
              >
                디딤집 소개
              </Link>
              <Link
                href="/advertise"
                className="block text-muted-foreground hover:text-foreground"
              >
                광고제휴
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground">
          Copyright &copy; Fundable Corp. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
