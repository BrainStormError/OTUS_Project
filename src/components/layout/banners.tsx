export type Banner = {
  id: string;
  tone: 'info' | 'warning';
  message: string;
};

export function Banners({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {banners.map((banner) => (
        <div
          key={banner.id}
          role="status"
          className={
            banner.tone === 'warning'
              ? 'rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm'
              : 'rounded-md border bg-muted px-4 py-2 text-sm'
          }
        >
          {banner.message}
        </div>
      ))}
    </div>
  );
}
