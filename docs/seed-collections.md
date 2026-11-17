# Graines, décors et jardins de collection

## Équilibrage initial

| Action ou acquisition                           |                                Graines |
| ----------------------------------------------- | -------------------------------------: |
| Première réussite d’une page, même à une étoile |                                     +1 |
| Premières trois étoiles de cette page           |                           +1, une fois |
| Rejeu terminé                                   | +1, trois fois au maximum par jour UTC |
| Annuler, recommencer, indice, mélanger          |                                      0 |
| Décor des cinq premiers écosystèmes             |                              20 chacun |
| Décor des quinze suivants                       |                              50 chacun |
| Jardin des orchidées, première espèce incluse   |                                    150 |
| Chacune des cinq autres orchidées               |                                     45 |

La réserve initiale est vide. Les premiers chapitres des cinq premiers écosystèmes comptent vingt pages chacun, puis les quinze nouveaux écosystèmes cinquante pages chacun. Leurs gains garantis couvrent donc leur décor. Les cinq revisites de trente pages des premiers écosystèmes apportent les 150 graines restantes : 1 000 pages garanties paient les vingt décors (850) et l’entrée du jardin (150), même sans bonus d’étoiles. Les étoiles, les nouvelles pages des jardins et les rejeux financent ensuite les espèces supplémentaires. Cet équilibrage initial doit être éprouvé avec des joueurs avant de fixer les futurs prix.

Le plafond des rejeux est partagé entre campagne et jardins. Améliorer une ancienne page à trois étoiles peut cumuler la prime unique d’étoiles et une graine de rejeu. Un rechargement du bilan ne redonne rien. Le jour utilise UTC ; reculer l’horloge avant le dernier jour enregistré ne réarme pas la limite.

## Sauvegardes existantes

Le format principal reste `version: 2`. `economyVersion: 1` marque la migration : solde conservé, une graine créditée par page principale déjà terminée, remboursement des papiers sauge (100) et rose (150) déjà acquis. Ces papiers et leur sélection restent conservés. Aucun remboursement d’anciens indices ou mélanges n’est inventé : leur historique de dépenses n’existe pas.

Les nouvelles acquisitions, les espèces, les puzzles interrompus et les récompenses sont enregistrés dans le même document local, avec la file d’écriture existante. Le jardin utilise son propre plateau, historique, mouvements et registre de pages ; entrer dans un jardin ne remplace pas une tentative de la campagne. Les achats vérifient solde, disponibilité et propriété dans le modèle, en plus de la confirmation visuelle. Rééquiper un décor acquis est gratuit.

La remise à zéro explicite conserve les réglages et efface toute la progression, y compris les acquisitions avec graines. Les deux avertissements le précisent. Il n’existe pas encore d’acquisition en argent réel ; avant leur activation, les droits payés devront être restaurables indépendamment de ce reset.

## Contenu et calendrier

Le catalogue `src/data/collections.ts` contient actuellement **un** jardin, `orchidees-lumiere`, avec six orchidées imaginaires. Les illustrations sont embarquées ; aucune connexion n’est nécessaire pour les afficher. Les trente puzzles ont été générés séparément de la campagne, dédupliqués et certifiés avec une recherche de solution minimale exacte. Chaque espèce possède cinq pages successives. Les puzzles et leurs identifiants sont immuables dans `collectionPuzzles.json`.

`npm run levels:orchids` conserve les pages déjà présentes et ne génère que celles de nouvelles espèces ajoutées au catalogue. Ne pas modifier ni supprimer les entrées acquises : une mise à jour de la campagne ou du catalogue ne doit pas changer leurs puzzles enregistrés.

La mise à la une suit des cycles de deux mois à partir du premier janvier UTC (janvier-février, mars-avril, etc.). L’orchidée commence le 1er novembre 2026. Pour une prochaine collection : ajouter son jardin avec un identifiant stable et sa date de début de cycle, les illustrations référencées par espèce, puis générer/certifier ses pages. Aucun contenu futur n’est généré automatiquement par le calendrier ; le dernier jardin disponible reste à la une tant qu’un nouveau n’est pas prêt.

Seul le jardin à la une peut être acquis pour la première fois. Une fois acquis, il reste affiché dans « Mes jardins », jouable et complétable, avec possibilité d’acquérir ses espèces manquantes, même après sa rotation. Les acquisitions n’expirent pas.

## Vérification et achats réels

`tests/collections.test.ts` simule les 1 000 récompenses garanties, l’achat des vingt décors puis du jardin, les doubles achats, la migration répétée, le plafond quotidien, la rotation et la reprise indépendante des orchidées. Il vérifie les trente certificats et leurs minima. `npm run test:collections` joue les cinq premières pages dans l’interface et contrôle achats, rechargements, sauvegardes anciennes et trois tailles d’écran. `GAME_TEST_URL` désigne le serveur Expo ou l’export Web à tester.

Cette livraison dépense uniquement des graines gagnées en jeu. Les packs payants, StoreKit et Google Play Billing restent désactivés. La sauvegarde et l’horloge sont locales : avant de vendre des graines, il faudra un registre de transactions fiable, la validation des reçus, la restauration des droits, la gestion des remboursements et les tests des boutiques. Le plafond local actuel sert à équilibrer le jeu hors ligne, pas à sécuriser une monnaie achetée.
