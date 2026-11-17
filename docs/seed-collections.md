# Graines, décors et jardins de collection

## Équilibrage actuel

| Action ou acquisition                                    |      Graines |
| -------------------------------------------------------- | -----------: |
| Page principale réussie avec une ou deux étoiles         |            0 |
| Premières trois étoiles d’une page principale            | +1, une fois |
| Rejeu d’une page principale déjà réussie à trois étoiles |            0 |
| Page de collection saisonnière, même à trois étoiles     |            0 |
| Annuler, recommencer, indice, mélanger                   |            0 |
| Décor des cinq premiers écosystèmes                      |    20 chacun |
| Décor des quinze suivants                                |    50 chacun |
| Jardin des orchidées, première espèce incluse            |          150 |
| Chacune des cinq autres orchidées                        |           45 |

La réserve initiale est vide. Les 1 000 pages principales permettent de gagner au maximum **1 000 graines**, en obtenant trois étoiles sur chacune. Une page principale réussie à une ou deux étoiles peut être rejouée pour obtenir sa seule graine à trois étoiles. Une fois celle-ci obtenue, aucune tentative supplémentaire ne rapporte de graine, même après mélange, rechargement ou changement de jour.

Les premiers chapitres des cinq premiers écosystèmes comptent vingt pages chacun, puis les quinze nouveaux écosystèmes cinquante pages chacun. Obtenir trois étoiles sur toutes les pages d’un premier chapitre permet de payer son décor. Les vingt décors coûtent 850 graines ; le jardin et ses six orchidées coûtent 375 graines (150 + 5 × 45). La boutique actuelle coûte donc **1 225 graines**, soit 225 de plus que le maximum de gains d’un nouveau carnet. Les trente puzzles saisonniers ne financent aucun achat. Avant l’activation des achats réels, le joueur doit choisir ses acquisitions avec son solde limité.

L’ancien champ `replayRewards` reste lisible pour la compatibilité des sauvegardes mais n’accorde aucun gain. La progression, les étoiles et les illustrations des jardins restent enregistrées même sans récompense monétaire.

## Sauvegardes existantes

Le format principal reste `version: 2`. `economyVersion: 1` marque la migration : solde conservé sans crédit automatique des anciennes pages terminées, remboursement des papiers sauge (100) et rose (150) déjà acquis. Ces papiers et leur sélection restent conservés. Les graines déjà attribuées par les règles précédentes restent acquises ; cette mise à jour ne retire ni solde ni acquisition. Les anciennes sessions de jardin peuvent toujours être relues, mais les victoires suivantes donnent zéro graine. Aucun remboursement d’anciens indices ou mélanges n’est inventé : leur historique de dépenses n’existe pas.

Les nouvelles acquisitions, les espèces, les puzzles interrompus et les récompenses sont enregistrés dans le même document local, avec la file d’écriture existante. Le jardin utilise son propre plateau, historique, mouvements et registre de pages ; entrer dans un jardin ne remplace pas une tentative de la campagne. Les achats vérifient solde, disponibilité et propriété dans le modèle, en plus de la confirmation visuelle. Rééquiper un décor acquis est gratuit.

La remise à zéro explicite conserve les réglages et efface toute la progression, y compris les acquisitions avec graines. Les deux avertissements le précisent. Il n’existe pas encore d’acquisition en argent réel ; avant leur activation, les droits payés devront être restaurables indépendamment de ce reset.

## Contenu et calendrier

Le catalogue `src/data/collections.ts` contient actuellement **un** jardin, `orchidees-lumiere`, avec six orchidées imaginaires. Les illustrations sont embarquées ; aucune connexion n’est nécessaire pour les afficher. Les trente puzzles ont été générés séparément de la campagne, dédupliqués et certifiés avec une recherche de solution minimale exacte. Chaque espèce possède cinq pages successives. Les puzzles et leurs identifiants sont immuables dans `collectionPuzzles.json`.

`node --import tsx scripts/generate-orchid-pages.ts` conserve les pages déjà présentes et ne génère que celles de nouvelles espèces ajoutées au catalogue. Ne pas modifier ni supprimer les entrées acquises : une mise à jour de la campagne ou du catalogue ne doit pas changer leurs puzzles enregistrés.

La mise à la une suit des cycles de deux mois à partir du premier janvier UTC (janvier-février, mars-avril, etc.). L’orchidée commence le 1er novembre 2026. Pour une prochaine collection : ajouter son jardin avec un identifiant stable et sa date de début de cycle, les illustrations référencées par espèce, puis générer/certifier ses pages. Aucun contenu futur n’est généré automatiquement par le calendrier ; le dernier jardin disponible reste à la une tant qu’un nouveau n’est pas prêt.

Seul le jardin à la une peut être acquis pour la première fois. Une fois acquis, il reste affiché dans « Mes jardins », jouable et complétable, avec possibilité d’acquérir ses espèces manquantes, même après sa rotation. Les acquisitions n’expirent pas.

## Vérification et achats réels

`tests/collections.test.ts` simule le plafond de 1 000 graines de la campagne à trois étoiles, l’achat des vingt décors puis du jardin, les doubles achats, la migration répétée, l’absence de gains à une ou deux étoiles, la prime unique des trois étoiles de la campagne et l’absence de gains sur les trente pages saisonnières, la rotation et la reprise indépendante des orchidées. Il vérifie les trente certificats et leurs minima. `node --import tsx scripts/collections-smoke.ts` joue les cinq premières pages dans l’interface et contrôle achats, rechargements, sauvegardes anciennes et trois tailles d’écran. `GAME_TEST_URL` désigne le serveur Expo ou l’export Web à tester.

Cette livraison dépense uniquement des graines gagnées en jeu. Les packs payants, StoreKit et Google Play Billing restent désactivés. La sauvegarde est locale : avant de vendre des graines, il faudra un registre de transactions fiable, la validation des reçus, la restauration des droits, la gestion des remboursements et les tests des boutiques.
