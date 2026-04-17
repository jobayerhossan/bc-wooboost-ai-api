export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">BitwiseCode API</p>
        <h1>BC WooBoost AI backend is ready for WordPress plugin traffic.</h1>
        <p className="lede">
          This service powers secure site connection, credit balance checks,
          AI-assisted WooCommerce description optimization, and request logging.
        </p>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Base URL</h2>
          <p>
            Point the WordPress plugin setting to
            <code> https://api.bitwisecode.com/v1</code>
          </p>
        </article>

        <article className="panel">
          <h2>Endpoints</h2>
          <ul>
            <li>
              <code>GET /v1/health</code>
            </li>
            <li>
              <code>POST /v1/site/connect</code>
            </li>
            <li>
              <code>GET /v1/credits/balance</code>
            </li>
            <li>
              <code>POST /v1/optimize-description</code>
            </li>
          </ul>
        </article>

        <article className="panel">
          <h2>Deployment</h2>
          <p>
            Deploy this app to Vercel, configure the production environment
            variables, run the SQL migration, and attach the
            <code> api.bitwisecode.com</code> subdomain.
          </p>
        </article>
      </section>
    </main>
  );
}
