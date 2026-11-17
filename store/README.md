# Référencement des boutiques et du Web

La fiche française est dans [listing.fr-FR.json](listing.fr-FR.json). Elle conserve la marque **Herbier des couleurs** et positionne le jeu sur le tri de couleurs, les puzzles de logique et la collection botanique. Le titre proposé sur Google Play ajoute « : puzzle » ; le sous-titre Apple indique « Puzzles de tri et botanique ». Le nom installé du jeu reste inchangé. Les descriptions présentent les 1 000 pages, 200 espèces et 20 écosystèmes réellement livrés. Les futurs modes quotidiens et mystère ne sont pas annoncés comme jouables.

## Préparer les fiches

```sh
npm run store:generate
npm run store:check
```

La première commande régénère les fichiers texte ; la seconde contrôle leurs longueurs et leur cohérence avec la source. Aucune des deux commandes ne publie une fiche ou une application.

| Boutique        | Éléments préparés                                                            | Limites contrôlées                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Apple App Store | `apple/fr-FR/` : nom, sous-titre, mots-clés, description, texte promotionnel | Nom et sous-titre : 30 caractères ; description : 4 000 ; promotion : 170 ; mots-clés : 100 octets UTF-8, virgules comprises, pour respecter aussi la limite de 100 caractères |
| Google Play     | `google-play/fr-FR/` : titre, description courte et complète                 | 30, 80 et 4 000 caractères                                                                                                                                                     |
| Xiaomi GetApps  | `xiaomi/fr-FR/draft.json` : proposition à reporter dans Mi Developer         | Les contraintes GetApps doivent être contrôlées dans la console ; le brouillon ne prétend pas être un format d’import Xiaomi                                                   |

Les dossiers Apple et Google suivent les conventions de métadonnées de **fastlane deliver/supply**. On peut aussi copier leur contenu dans les consoles. Expo Metadata prend actuellement en charge Apple, pas Google Play ; ajouter des mots-clés à `app.json` ou envoyer une mise à jour EAS ne remplace pas ces fiches.

Catégories recommandées à sélectionner dans les consoles : **Jeux > Puzzle / Casual** chez Apple et **Jeux > Réflexion (Puzzle)** sur Google Play. Les mots-clés Apple complètent le nom et le sous-titre. Google Play utilise les textes de la fiche et n’a pas de champ de mots-clés équivalent. Aucun classement, prix, avis ou note n’est inventé.

## Xiaomi

Un téléphone Xiaomi compatible peut utiliser la version Android distribuée sur Google Play lorsque cette boutique est disponible. GetApps constitue un canal distinct, avec son propre compte développeur, sa fiche et sa validation. Vérifier les pays et langues proposés dans Mi Developer avant de prévoir une diffusion : la disponibilité de GetApps et de ses services varie suivant le marché. La diffusion en Chine continentale relève d’un parcours différent.

Le référencement ne nécessite pas d’ajouter un SDK Xiaomi au jeu. Les achats ne sont pas actifs actuellement ; si la monétisation est activée plus tard, vérifier séparément les exigences de facturation de chaque canal. Ne pas changer le package `com.colorworld.herbier` ou la signature Android pour un simple changement de fiche.

## Éléments à finaliser avant soumission

Les textes sont préparés en français, qui est la langue actuelle du jeu. Des fiches dans d’autres langues devront annoncer honnêtement la langue du jeu, ou accompagner sa localisation.

Préparer des captures réelles des versions à publier : le plateau et un versement, la révélation d’une plante, la collection, la carte des écosystèmes et le menu. Les légendes peuvent présenter « Triez les pigments », « Faites refleurir 200 plantes », « Parcourez 1 000 puzzles », « Explorez 20 écosystèmes » et « Retrouvez votre herbier hors connexion ». Les captures Apple doivent provenir de l’application iOS ; une capture Web ne prouve pas le rendu iPhone.

Les comptes App Store Connect / Play Console / Mi Developer, les versions signées, l’icône de boutique, les captures aux dimensions demandées, les liens publics d’assistance et de confidentialité, les coordonnées du responsable et les déclarations des boutiques restent à finaliser. Les fichiers générés n’inventent ni ces informations ni des URL de téléchargement. Une session Expo ne fournit pas à elle seule l’accès aux trois boutiques. Les textes sont une base éditoriale à mesurer ensuite avec les statistiques et les tests de fiches des plateformes ; ils ne garantissent pas une position dans les résultats.

## SEO de la version Web

L’export Expo est en mode `single` : `app/+html.tsx` n’est pas rendu pendant cet export. `scripts/offline.mjs` applique donc les métadonnées au HTML réellement livré : langue française, titre descriptif, description, Open Graph, Twitter et données structurées `VideoGame`. Le manifeste Web utilise la même description courte. Les routes du carnet et les copies de navigation sont marquées `noindex,follow` ; le point d’entrée du jeu reste indexable.

Une origine publique explicite permet de générer la canonique et le sitemap sans inventer de domaine :

```sh
EXPO_PUBLIC_SITE_ORIGIN=https://jbdainty.github.io \
EXPO_PUBLIC_BASE_PATH=/Herbier-des-Couleurs npm run build:web
```

`npm run deploy:pages` déduit automatiquement l’origine GitHub Pages et le préfixe du dépôt `origin`. Pour un domaine personnalisé à la racine, fournir son origine HTTPS et `EXPO_PUBLIC_BASE_PATH=` vide. Sans origine, les métadonnées de base sont présentes mais aucune canonique ou sitemap n’est inventé.

Sur GitHub Pages avec un sous-répertoire, le fichier `robots.txt` placé dans ce répertoire n’est pas le fichier robots du domaine : seul `https://jbdainty.github.io/robots.txt` fait autorité. Le sitemap du projet peut être soumis directement à Search Console ou référencé depuis ce fichier racine si le propriétaire le gère. Il ne contient que l’accueil public, pas les routes de progression.

## Références

- [Apple : fiche produit](https://developer.apple.com/app-store/product-page/) et [recherche App Store](https://developer.apple.com/app-store/search/).
- [Google : champs de la fiche](https://support.google.com/googleplay/android-developer/answer/9859152?hl=fr) et [bonnes pratiques](https://support.google.com/googleplay/android-developer/answer/13393723?hl=fr).
- [Expo Metadata : périmètre pris en charge](https://docs.expo.dev/eas/metadata/).
- [fastlane deliver](https://docs.fastlane.tools/actions/deliver/) et [supply](https://docs.fastlane.tools/actions/supply/).
- [Mi Developer](https://global.developer.mi.com/) et [GetApps](https://global.app.mi.com/).
