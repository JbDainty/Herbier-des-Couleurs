import { ScrollViewStyleReset } from 'expo-router/html';
import { basePath } from '../src/config/paths';
import listing from '../store/listing.fr-FR.json';
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#365c49" />
        <meta name="description" content={listing.web.description} />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <title>{listing.web.title}</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
