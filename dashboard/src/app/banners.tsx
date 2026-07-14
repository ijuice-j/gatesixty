/** Shared by day / week / month — all three reconstruct from the live calendar. */

export function ReconnectBanner({ what }: { what: string }) {
  return (
    <div className="ds-banner ds-banner--warning mb-4">
      <div className="ds-banner__content">
        Reconnect Google to reconstruct {what}.
      </div>
      <div className="ds-banner__actions">
        <form action="/auth/signout" method="post">
          <button className="ds-btn ds-btn--outline ds-btn--sm" type="submit">
            Reconnect
          </button>
        </form>
      </div>
    </div>
  );
}

export function LoadErrorBanner({ message }: { message: string }) {
  return (
    <div className="ds-banner ds-banner--danger mb-4">
      <div className="ds-banner__content">Failed to load activity: {message}</div>
    </div>
  );
}
