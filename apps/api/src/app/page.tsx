export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, lineHeight: 1.7 }}>
      <h1>DidimZip API</h1>
      <p>디딤집 개발용 Mock API 서버 (admin·web 공유 데이터).</p>
      <ul>
        <li>
          <code>GET /api/health</code>
        </li>
        <li>
          <code>GET /api/posts</code> · <code>POST /api/posts</code>
        </li>
        <li>
          <code>GET|PATCH|DELETE /api/posts/[id]</code>
        </li>
      </ul>
    </main>
  );
}
