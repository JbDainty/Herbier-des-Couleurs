# Découverte des mécaniques

La campagne principale, les orchidées et les merveilles utilisent le même registre `seenMechanics` du carnet. Une mécanique réellement présente dans le puzzle ouvre une explication avant le premier versement si elle n’a jamais été validée. L’ouverture ne dépend pas du numéro de page : un joueur qui découvre un filtre dans une collection ne reçoit pas à nouveau sa présentation dans la campagne.

L’encart montre **une mécanique à la fois**, son nom, une illustration lorsque l’écran le permet et un résumé de une ou deux phrases. « En savoir plus » déplie le texte complet existant. Si plusieurs mécaniques sont nouvelles, le compteur indique les cartes restantes dans la séquence. « J’ai compris » enregistre uniquement la carte visible ; il ne valide jamais d’autres explications non affichées. Un rechargement reprend les mécaniques qui restent à découvrir.

Le retour système quitte l’encart vers le menu ou la galerie sans marquer l’explication comme lue. La prochaine entrée dans le puzzle la proposera de nouveau. Les versements restent désactivés tant que les nouvelles règles de cette tentative ne sont pas validées. Les bilans de victoire ne déclenchent pas de nouvelle découverte.

Les collections conservent le bouton « Les mécanismes de cette page » pour consulter les règles à nouveau, une par une, et fermer le rappel à tout moment. Cette consultation ne réinitialise pas la découverte globale. La campagne conserve son aide existante.

Les leçons sont conservées par AsyncStorage/localStorage avec la sauvegarde habituelle. Une leçon validée dans une session de test est aussi mémorisée dans le carnet de retour, sans modifier sa progression, ses mouvements, ses graines ou ses acquisitions. Une remise à zéro complète du carnet recommence les présentations comme les autres premiers pas. Les anciennes listes de mécaniques validées restent conservées.

`tests/mechanic-lessons.test.ts` vérifie les huit résumés, la déduplication, la validation d’une seule carte, la découverte hors ordre dans une collection, la persistance d’une séquence incomplète et le retour d’une session de test.

`GAME_TEST_URL=http://localhost:8126/ node --import tsx scripts/mechanic-lessons-smoke.ts` joue les huit présentations réelles, leurs détails facultatifs sur quatre formats, une découverte de trois mécaniques dans les orchidées avec rechargement après la première, puis la campagne et une merveille. Les présentations déjà validées ne réapparaissent pas et ni les plateaux ni la réserve ne sont modifiés par les explications.
