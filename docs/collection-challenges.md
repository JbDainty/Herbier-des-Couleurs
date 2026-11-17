# Défis experts des collections

Les 30 pages d’orchidées et les 25 pages de l’Herbier des Merveilles utilisent désormais une banque experte séparée de la campagne et des archives classiques. Chaque page combine **trois mécanismes**, **cinq ou six teintes**, et demande **14 à 18 versements au minimum**. La dernière page de chaque espèce a un minimum de 18. La campagne finit avec une alternance de pages de respiration et de défis ; le palier des collections reprend ses profils exigeants plutôt que la seule page 1 000, qui est une respiration.

## Construction et plusieurs solutions

`node --import tsx scripts/generate-expert-collections.ts` conserve les défis déjà présents et ajoute uniquement les espèces manquantes. Il sélectionne des profils certifiés de la campagne, permute fioles et couleurs en remappant toutes les contraintes, et ajoute un mécanisme compatible avec deux chemins minimaux. Les deux chemins diffèrent par l’ordre de véritables choix de couleurs indépendants, sans détour ni cycle. Les filtres et fioles de conservation ajoutés retirent seulement des mouvements possibles ; le minimum d’origine reste une borne inférieure, atteinte par les deux chemins conservés. Les teintes mystères changent l’information visible, pas la légalité des versements.

Les tests rejouent les chemins avec une implémentation indépendante des règles. Les minima des 55 pages sont aussi recalculés par le solveur exact dans les tests des collections. Les huit familles de mécanismes apparaissent dans la banque. Les 1 000 pages principales restent inchangées.

Les données publiées sont figées dans `src/data/collectionExpertPuzzles.json`. Ne pas régénérer ni modifier une entrée existante : une future refonte doit créer une nouvelle version. Le générateur classique `generate-orchid-pages.ts` reste destiné aux anciennes archives.

## Garantie de reprise

Les mécanismes irréversibles peuvent produire une position réellement insoluble. La garantie est de **toujours pouvoir reprendre un chemin de victoire**, même après une impasse ou un rechargement ; elle ne prétend pas que chaque position peut être gagnée uniquement avec des versements en avant.

Chaque tentative garde un témoin de solution : une position de son historique et une liste de versements vérifiée jusqu’à la victoire. Suivre un indice raccourcit ce chemin. Un autre choix reste libre ; si une recherche trouve une nouvelle continuation, celle-ci devient un nouveau point sûr. Une recherche interrompue ou hors budget n’est jamais présentée comme une preuve d’impossibilité.

Le bouton **Chemin sûr**, gratuit et sans limite, revient au dernier point pour lequel un chemin est certifié. Il peut annuler des choix de la tentative ; l’interface l’annonce. Les achats, espèces, pages terminées, étoiles précédentes, graines et campagne principale restent conservés. La position initiale et son certificat fournissent toujours une solution de repli. Recommencer et Annuler restent également gratuits.

Le contrôle des règles est commun à l’interface, au moteur, aux indices et aux animations : capacités, verrous, filtres, cristaux, fioles sœurs, compte-gouttes et conservation sont réellement appliqués. Les teintes mystères et les informations découvertes suivent les versements, l’annulation et la sauvegarde. Les règles sont expliquées à leur première rencontre et restent consultables pendant la page.

## Compatibilité et économie

Une session sans `puzzleVersion` est une tentative classique de version 1. Elle garde son plateau, son historique, ses règles et son certificat d’origine dans `collectionPuzzles.json`. Recommencer cette tentative conserve aussi sa version. Le bouton explicite « Recommencer en défi expert » permet de passer immédiatement à la nouvelle difficulté en remettant les versements de cette page à zéro. Une nouvelle tentative ou la page suivante charge la version 2 experte. Les acquisitions et les cinq étapes de restauration par espèce restent identiques ; aucun score déjà acquis n’est rétrogradé.

Les aides, la récupération et les victoires de collection ne donnent ni ne dépensent de graines. Le plafond de campagne et les prix de la boutique restent identiques.

## Vérifications

`tests/expert-collections.test.ts` vérifie les deux chemins de chaque défi, la variété des mécanismes, une véritable impasse irréversible récupérée en annulant un seul choix, plus de 2 500 choix légaux avec annulations/rechargements suivis d’une victoire, les témoins corrompus, les teintes cachées et une ancienne tentative classique.

`GAME_TEST_URL=http://localhost:8126/ node --import tsx scripts/expert-collections-smoke.ts` vérifie les explications, le plateau réellement bloqué puis récupéré, les indices jusqu’à la victoire sans boucle, un autre chemin pour une merveille, les petites fioles/verrous sur quatre formats et la transition d’une sauvegarde classique vers un défi expert.
