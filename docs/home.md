# Le menu principal — Clairière des lucioles

`/` est le menu du jeu ; la restauration continue sur `/atelier` et le défi de lumière sur `/vitrail`. La signature d’un carnet ouvre ce menu. Un carnet signé y arrive au lancement, avec sa progression, sans relire automatiquement le prologue.

La maquette « Clairière des lucioles » choisie le 20 novembre 2026 devient une interface native : les textes et commandes restent de vrais éléments accessibles. Le décor aquarellé sauge et lavande, le livre botanique et la rosace sont des illustrations indépendantes. Almendra sert à la marque et aux titres ; Alegreya Sans sert aux informations et à la navigation. Aucun nom scientifique en italique ni police manuscrite ne s’ajoute au menu.

La grande carte parchemin « La Restauration » porte la vraie espèce, la page courante et l’action Commencer / Continuer / Rejouer. Une carte céladon distincte propose « Le Vitrail du jour » avec son action Jouer et son état 3 vitraux / Terminé. Le petit encart lavande « Les Encres oubliées · À venir » reste sans interaction jouable. Les illustrations sont décoratives ; le livre ne constitue pas un deuxième accès à l’Herbier. La réserve de graines accompagne le titre dans un badge clair.

Les deux aventures partagent la même composition : grand titre, ligne centrale regroupant description et progression à gauche de l’illustration, puis ruban d’action centré de même largeur et de 48 points de haut. Sur téléphone, les titres atteignent 36 points, les descriptions 18 et la progression 17 ; les tablettes utilisent respectivement 42, 22 et 20 points. Le livre et la rosace agrandis sont entourés d’un halo aquarellé, de feuillages et de pollen doré. Les illustrations participent à la mise en page et leur taille suit l’espace disponible, y compris avec du texte agrandi. Les variantes compactes gardent la priorité aux commandes et à l’état du défi.

Les cartes ordinaires réservent 24 points de chaque côté du contenu sur téléphone, 28 sur les grandes cartes et 16 en haut et en bas ; les formats courts conservent leurs variantes compactes. Le titre s’adapte à la largeur intérieure pour rester entier. Le flottement atteint 7 points de part et d’autre de sa position, avec une inclinaison de 3 à 4 degrés et un léger déplacement latéral. Le pollen parcourt 20 points verticalement, avec un mouvement latéral et une inclinaison plus visibles, toujours pilotés par l’horloge commune.

Quatre raccourcis forment le pied du menu : Herbier, Écosystèmes, Boutique et Paramètres. Aide et Revoir le prologue sont des liens secondaires ; sur le paysage très court, leurs icônes se placent dans le bandeau. Les commandes conservent leurs noms d’accessibilité et des zones tactiles d’au moins 44 points ; le bouton principal garde 48 points. Le Vitrail entier est un seul bouton accessible, sans boutons imbriqués ; son état terminé est aussi annoncé aux lecteurs d’écran.

## Adaptation aux écrans

`src/layout/home.ts` calcule la composition dans la zone sûre mesurée. En portrait, les deux aventures sont empilées sur toute la largeur des cartes et le teaser reste plus petit. En paysage, la restauration est à gauche et les deux autres cartes sont empilées à droite. Les dimensions sont réservées après le titre et la navigation. Les petits écrans condensent descriptions et ornements, puis le rappel de la plante et de la page ; sur les plus courts, le titre intermédiaire cède aussi sa place aux modes. Les accès restent visibles sans défilement. La carte quotidienne garde sa cible entière, même lorsque son ruban se transforme en libellé court.

La texture du papier garde son opacité habituelle ailleurs dans le jeu ; les trois cartes du menu utilisent des opacités dédiées pour préserver leur couleur et la séparation entre modes. Les cadres fins n’empiètent pas sur les titres.

## Décor et animations

`HomeClearing` est propre au menu. Le Vitrail et les fonds de la boutique continuent à utiliser `HomeGarden` ; l’atelier conserve sa serre. Les trois nouveaux fichiers optimisés représentent environ 310 ko et fonctionnent hors ligne. Les grandes sources et leur préparation sont conservées dans `art/home/` et `scripts/prepare-menu-clearing.mjs`.

`HomeMagicMotion` partage une seule horloge native entre les deux groupes de trois lucioles, le rameau, les deux illustrations flottantes et leurs deux nuages de pollen : translations, rotations et opacités uniquement. Les chemins SVG et le grand fond restent fixes. Les couches des cartes ne dépassent pas 180 × 180 points ; les trois couches du décor gardent 70 × 160, 70 × 160 et 70 × 172 points. Aucun cache plein écran, filtre ou rendu 3D supplémentaire n’est nécessaire. Les mouvements ne déclenchent aucune mise à jour React à chaque image. En mode sans animations, les grands dessins, halos et feuillages restent visibles, sans les couches de pollen animées.

L’ambiance démarre pendant l’apparition du menu : le flottement, le pollen et les lucioles sont déjà en mouvement sous la montée en opacité. L’entrée du menu ne prend plus la priorité globale et ne bloque donc pas sa propre ambiance. La fin des 2,6 secondes d’apparition ne remonte pas les effets et ne relance pas leur horloge. L’ambiance s’arrête à la sortie, pendant le prologue et en arrière-plan, puis repart au retour. La bourse garde son petit mouvement périodique existant. Les contrôles du navigateur et le processeur ralenti ne remplacent pas une mesure sur téléphone physique.

## Navigation et sauvegarde

Le shell conserve le menu déjà visité dans `HomeRouteCache` : ses vues et ses dessins ne sont plus démontés puis reconstruits en bloc au retour de l’atelier ou du Vitrail. Sur une autre page, cette surface est masquée, sans interaction ni accès pour le lecteur d’écran ; ses animations sont arrêtées. Un accès direct à une page ne monte pas le menu à l’avance. Le reset et la relecture du prologue libèrent le cache. Les cartes et les connexions de l’entrée native sont mémoïsées ; la reprise conserve les mêmes durées, positions et courbes. `useNativeProgress` ne réutilise pas un ancien état « terminé » pendant la réactivation d’une entrée : la navigation et l’annonce de la fin de l’apparition restent ainsi cohérentes, indépendamment de l’ambiance qui s’exécute en parallèle.

`homeProgress` ne charge aucun niveau. Continuer conserve les fioles, mouvements, historique, indices acquis et graines. Le premier lancement effectif de la restauration ouvre le guide si nécessaire. Le Vitrail initialise seulement sa propre progression lors de son ouverture. L’aide reste toujours disponible. Le prologue est volontaire ; sa relecture ne touche pas au carnet et son audio garde le coordinateur existant.

Un appui rapide termine l’entrée avant la navigation, sans attendre les 2,6 secondes complètes. `HomeScreen` fixe la pose finale, libère la priorité d’animation, puis exécute une seule action à la prochaine image. Une autre destination peut remplacer une demande en attente. Le Vitrail utilise la même sortie que les autres destinations. `openWorkshop` conserve aussi le menu jusqu’à disponibilité du décor de serre et des mesures de l’indice ; partir ailleurs annule la demande. Les fioles, le cadre et les commandes sont prêts dès la première image du jeu.

La route directe `/herbier?plant=…` reste disponible pour une planche liée ; le raccourci Herbier ouvre normalement la collection.

## Vérification

`tests/home-layout.test.ts` contrôle les deux aventures, le teaser et la navigation sur dix-neuf formats et deux tailles de texte. `home-smoke.ts` couvre signature, reprise, aide, prologue, les dix-neuf formats, l’absence de texte tronqué ou de police supplémentaire, les graines, les préférences et le reset. `home-garden-smoke.ts` vérifie les transformations sans mutation SVG, l’arrêt et la reprise avec AppState, la sortie et le mode sans animations. `home-quick-entry-smoke.ts` contrôle les triples appuis immédiats vers l’atelier, l’Herbier, les écosystèmes, le Vitrail et le premier guide, avec processeur ralenti quatre fois. `vitrail-smoke.ts` joue les trois défis depuis leur vraie carte, les explications, les reprises et les récompenses. Les exports Hermes complètent ces contrôles.
