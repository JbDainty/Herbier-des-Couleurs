# Graines, décors et jardins de collection

## Équilibrage actuel

| Action ou acquisition                                    |               Graines |
| -------------------------------------------------------- | --------------------: |
| Page principale réussie avec une ou deux étoiles         |                     0 |
| Premières trois étoiles d’une page principale            |          +1, une fois |
| Rejeu d’une page principale déjà réussie à trois étoiles |                     0 |
| Page de collection saisonnière, même à trois étoiles     |                     0 |
| Trois vitraux du jour terminés, sans étoiles             | +1, une fois par jour |
| Vitrail isolé ou rejeu d’un feuillet passé               |                     0 |
| Annuler, recommencer, indice, mélanger                   |                     0 |
| Décor des cinq premiers écosystèmes                      |             20 chacun |
| Décor des quinze suivants                                |             50 chacun |
| Jardin des orchidées, première espèce incluse            |                   150 |
| Chacune des cinq autres orchidées                        |                    45 |
| Chaque merveille de l’herbier doré                       |                   200 |

La réserve initiale est vide. Les 1 000 pages principales permettent de gagner au maximum **1 000 graines**, en obtenant trois étoiles sur chacune. Une page principale réussie à une ou deux étoiles peut être rejouée pour obtenir sa seule graine à trois étoiles. Une fois celle-ci obtenue, aucune tentative supplémentaire ne rapporte de graine, même après mélange, rechargement ou changement de jour.

Le [Vitrail du jour](daily-vitrail.md) ajoute une graine après les trois défis de la date UTC courante, sans étoiles. La réserve initiale de 365 journées permet de gagner jusqu’à **365 graines supplémentaires**, soit **1 365** avec toute la campagne. Les archives et les replays ne donnent aucune graine. Le plafond des 1 000 récompenses de campagne reste indépendant.

Les premiers chapitres des cinq premiers écosystèmes comptent vingt pages chacun, puis les quinze nouveaux écosystèmes cinquante pages chacun. Obtenir trois étoiles sur toutes les pages d’un premier chapitre permet de payer son décor. Les vingt décors coûtent 850 graines ; le jardin et ses six orchidées coûtent 375 graines (150 + 5 × 45). Les cinq merveilles dorées ajoutent 1 000 graines : la boutique complète coûte donc **2 225 graines**, soit 1 225 de plus que le maximum de gains de la campagne principale. Les trente puzzles saisonniers ne financent aucun achat. Avant l’activation des achats réels, le joueur doit choisir ses acquisitions avec son solde limité.

L’ancien champ `replayRewards` reste lisible pour la compatibilité des sauvegardes mais n’accorde aucun gain. La progression, les étoiles et les illustrations des jardins restent enregistrées même sans récompense monétaire.

## Sauvegardes existantes

Le format principal reste `version: 2`. `economyVersion: 1` marque la migration : solde conservé sans crédit automatique des anciennes pages terminées, remboursement des papiers sauge (100) et rose (150) déjà acquis. Ces papiers et leur sélection restent conservés. Les graines déjà attribuées par les règles précédentes restent acquises ; cette mise à jour ne retire ni solde ni acquisition. Les anciennes sessions de jardin peuvent toujours être relues, mais les victoires suivantes donnent zéro graine. Aucun remboursement d’anciens indices ou mélanges n’est inventé : leur historique de dépenses n’existe pas.

Les nouvelles acquisitions, les espèces, les puzzles interrompus et les récompenses sont enregistrés dans le même document local, avec la file d’écriture existante. Le jardin utilise son propre plateau, historique, mouvements et registre de pages ; entrer dans un jardin ne remplace pas une tentative de la campagne. Les achats vérifient solde, disponibilité et propriété dans le modèle, en plus de la confirmation visuelle. Rééquiper un décor acquis est gratuit.

La remise à zéro explicite conserve les réglages et efface toute la progression, y compris les acquisitions avec graines. Les deux avertissements le précisent. Il n’existe pas encore d’acquisition en argent réel ; avant leur activation, les droits payés devront être restaurables indépendamment de ce reset.

## Contenu et calendrier

Les 55 pages de collection chargent maintenant les [défis experts](collection-challenges.md) : trois mécanismes combinés, plusieurs chemins certifiés et récupération gratuite. Les anciens plateaux classiques restent archivés pour les tentatives déjà en cours.

### L’Herbier des Merveilles

La collection permanente `merveilles-or` contient cinq espèces imaginaires à 200 graines chacune : Orchidée du Phénix, Lotus des Constellations, Rose de l’Éclipse, Lys de Cristal et Passiflore du Temps. Le grand livre doré se trouve dans **Herbier**, sur une page entière : deux largeurs et deux hauteurs de carnets en portrait, avec adaptation à la zone disponible sur écran court ou en paysage. Le bouton « Merveilles » du feuilletage y mène directement. Les vingt carnets existants restent disponibles.

Consulter cet herbier est gratuit et ne crée aucune acquisition. Chaque espèce doit être achetée séparément, dans l’ordre souhaité ; aucune première plante n’est offerte et aucun droit d’entrée n’est facturé. L’acquisition crée le registre du livre uniquement au premier achat. Les illustrations sur fond d’or se dévoilent après acquisition ; les entrées verrouillées montrent des silhouettes gravées. Cinq puzzles originaux par espèce, vingt-cinq au total, enregistrent leur progression séparément de la campagne et des orchidées. Aucun puzzle de collection ne donne de graine.

Cette collection ne participe pas à la rotation saisonnière et ne remplace pas le jardin d’orchidées à la une. Les cinq espèces coûtent 1 000 graines ; la boutique complète coûte désormais **2 225 graines**, pour un gain maximal de 1 000 dans la campagne principale, auquel s’ajoute le journalier. Les prix des contenus précédents restent inchangés. Le reflet de dorure et les particules respectent le réglage des animations, la priorité des animations principales et la mise en arrière-plan.

`tests/golden-herbarium.test.ts` contrôle prix, propriété, ordre d’achat, reprise, minima des vingt-cinq puzzles et absence de gains. `node --import tsx scripts/golden-herbarium-smoke.ts` vérifie la couverture de quatre emplacements, les animations, les silhouettes, les achats sans double débit, les cinq pages d’une merveille, les rechargements et quatre formats d’écran.

### Jardins saisonniers

La partie saisonnière du catalogue `src/data/collections.ts` contient actuellement **un** jardin, `orchidees-lumiere`, avec six orchidées imaginaires. Les illustrations sont embarquées ; aucune connexion n’est nécessaire pour les afficher. Les trente puzzles ont été générés séparément de la campagne, dédupliqués et certifiés avec une recherche de solution minimale exacte. Chaque espèce possède cinq pages successives. Les puzzles et leurs identifiants sont immuables dans `collectionPuzzles.json`.

`node --import tsx scripts/generate-orchid-pages.ts` conserve les pages déjà présentes et ne génère que celles de nouvelles espèces ajoutées au catalogue. Ne pas modifier ni supprimer les entrées acquises : une mise à jour de la campagne ou du catalogue ne doit pas changer leurs puzzles enregistrés.

La mise à la une suit des cycles de deux mois à partir du premier janvier UTC (janvier-février, mars-avril, etc.). L’orchidée commence le 1er novembre 2026. Pour une prochaine collection : ajouter son jardin avec un identifiant stable et sa date de début de cycle, les illustrations référencées par espèce, puis générer/certifier ses pages. Aucun contenu futur n’est généré automatiquement par le calendrier ; le dernier jardin disponible reste à la une tant qu’un nouveau n’est pas prêt.

Seul le jardin à la une peut être acquis pour la première fois. Une fois acquis, il reste affiché dans « Mes jardins », jouable et complétable, avec possibilité d’acquérir ses espèces manquantes, même après sa rotation. Les acquisitions n’expirent pas.

## La galerie de la boutique

La première page met en avant l’Orchidée du Phénix, avec accès aux cinq merveilles, au jardin d’orchidées et aux décors. Le titre et les papiers ivoire reprennent les autres pages du jeu. Trois illustrations aquarellées fixes, conditionnées en WebP (environ 170 Ko au total), gardent les dessins doux et le rendu léger ; les compositions originales sont conservées dans `art/shop`.

Les rayons `jardins` et `decors` sont regroupés dans `/boutique?rayon=…`, avec retour à la galerie. Les prix, les conditions de découverte des écosystèmes, les confirmations et les droits acquis sont conservés. Les règles des graines sont regroupées dans une fenêtre dédiée.

L’offre « Retirer les pubs » est présentée à **1,99 €** avec la mention **Bientôt disponible**. Le bouton ouvre les informations de disponibilité. Le paiement et la restauration de l’achat nécessitent encore un produit configuré dans les boutiques.

Le profil Android `preview-ads` utilise les annonces interstitielles de démonstration de Google. Les dix premières pages sont exemptées. À partir de la troisième espèce, une annonce prête peut apparaître en quittant la victoire de la troisième ou de la cinquième page de l’espèce (13, 15, 18, 20…). Les reprises de pages déjà réussies, les vitraux, les collections bonus et le mode de test des niveaux sont exclus. Après l’annonce de fin de chaque deuxième espèce admissible (20, 30, 40…), le prochain passage au menu présente l’offre une fois. Le jeu continue immédiatement si l’annonce est indisponible. Les profils habituels gardent la diffusion désactivée.

`node --import tsx scripts/shop-gallery-smoke.ts` vérifie la disponibilité explicite de l’offre sans débit ni modification de sauvegarde, les achats/annulations/rechargements des merveilles, jardins et décors, les doubles confirmations, les restrictions en session d’essai et sept formats d’écran. Les tests de collections, merveilles et graines contrôlent également la comptabilité et les puzzles.

## Vérification et achats réels

`tests/collections.test.ts` simule le plafond de 1 000 graines de la campagne à trois étoiles, l’achat des vingt décors puis du jardin, les doubles achats, la migration répétée, l’absence de gains à une ou deux étoiles, la prime unique des trois étoiles de la campagne et l’absence de gains sur les trente pages saisonnières, la rotation et la reprise indépendante des orchidées. Il vérifie les trente certificats et leurs minima. `node --import tsx scripts/collections-smoke.ts` joue les cinq premières pages dans l’interface et contrôle achats, rechargements, sauvegardes anciennes et trois tailles d’écran. `GAME_TEST_URL` désigne le serveur Expo ou l’export Web à tester.

Cette livraison dépense uniquement des graines gagnées en jeu. Les packs payants, StoreKit et Google Play Billing restent désactivés. La sauvegarde est locale : avant de vendre des graines, il faudra un registre de transactions fiable, la validation des reçus, la restauration des droits, la gestion des remboursements et les tests des boutiques.
