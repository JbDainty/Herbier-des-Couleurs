# Le Vitrail du jour

Le nouveau mode remplace la carte « Le Feuillet du jour · À venir » sur l’accueil. Il reprend le jardin d’accueil, le papier, les bordures végétales, les polices, la réserve de graines et les icônes du jeu. Les règles et la progression sont indépendantes de la campagne et des collections achetées.

## Une page de jeu sans défilement

`VitrailScene` remplace le document déroulant par une composition calculée dans `src/layout/vitrail.ts`, à partir de la largeur et de la hauteur réellement mesurées après les zones sûres du système. L’en-tête, les étapes, les commandes, la récompense et le calendrier possèdent des emplacements réservés. Le carré de jeu occupe le reste de l’espace et tient dans ses deux dimensions, pour les grilles 4 × 4 et 5 × 5.

En portrait, les étapes sont regroupées en onglets, les quatre commandes tiennent sur une rangée et le calendrier partage le pied de page avec la récompense. En paysage, la grille utilise la hauteur à gauche et les informations et commandes se regroupent à droite. Les libellés courts des formats étroits conservent leurs noms complets pour les lecteurs d’écran. La navigation vers l’Herbier, les écosystèmes et la boutique reste accessible par Menu, sans barre de navigation supplémentaire sur la partie.

La partie, l’indice et la victoire utilisent le même budget de hauteur ; aucune nouvelle ligne ne pousse les commandes sous l’écran. La grille reste entière même sur les très petits formats, avec des cellules réduites si nécessaire. Les cellules atteignent au moins 44 points sur les formats de téléphone standards vérifiés, y compris après déduction des zones sûres. Les fenêtres d’explication et le calendrier conservent leur propre présentation.

Le cadre végétal réserve ses bandes décoratives : 32 points sur les côtés et 48 en haut et en bas. Il apparaît seulement si ces marges laissent la place à une grille avec des cellules de 44 points ; sinon le papier reste sans ornements dans l’aire de jeu. La grille, le message et les commandes forment un groupe centré, avec un espacement constant entre eux. La rangée des commandes ne dépasse pas 420 points afin de garder « Rejouer » et « Règles » côte à côte, même sur tablette. Le bandeau du calendrier réserve aussi sa propre marge intérieure autour des boutons.

## Une année embarquée

`src/data/vitrailYear.json` contient 365 dates consécutives, du **18 novembre 2026 au 17 novembre 2027 inclus**, avec trois grilles par date : 1 095 vitraux. Aucun téléchargement ni tirage aléatoire n’intervient pendant la partie. Le même jour UTC donne les mêmes trois grilles à tous les joueurs. L’écran surveille le changement de date et la remise au premier plan : le renouvellement à **00:00 UTC** ne demande pas de redémarrage.

Les grilles sont générées à partir de trajets résolus, puis mélangées. Le premier défi comporte des miroirs sur une grille 4 × 4 ; le deuxième ajoute un séparateur et deux fleurs sur une grille 5 × 5 ; le troisième associe miroirs, séparateur et mélangeur à deux sources de lumière. Les seuils de pièces et de rotations initiales assurent une complexité croissante dans chaque trio. Il n’y a ni étoiles, ni chronomètre, ni limite de mouvements.

La déduplication ignore le mélange de départ, l’orientation des pièces et toutes les couleurs ; elle compare aussi les quatre rotations et leurs reflets. Les 1 095 topologies sont distinctes : recolorer une même grille ne crée pas une nouvelle journée. Tous les certificats de solution sont exécutés dans les tests, avec les ports de bord et les couleurs exactes des fleurs.

## Lumière, explications et récupération

Les miroirs renvoient un rayon à angle droit. Un séparateur reçoit le rayon par sa tige et le partage entre sa direction principale et sa branche latérale. Un mélangeur accepte les rayons latéraux/arrière et les réunit vers sa flèche. Les mélanges sont ceux de la lumière : rouge + vert = jaune ; rouge + bleu = magenta ; vert + bleu = cyan ; les trois = blanc. Un simple croisement de rayons ne les mélange pas.

Une fleur exige exactement sa couleur : une composante supplémentaire ne convient pas. La propagation utilise un ensemble fini de canaux et de directions et termine même si le joueur crée une boucle. Le réglage des motifs ajoute les lettres des canaux aux sources et aux fleurs.

Chaque fleur porte un halo permanent de la couleur attendue, même avant d’être éclairée ou lorsqu’un rayon incorrect lui parvient. Les pétales restent lisibles, la bonne lumière renforce le halo et une coche confirme la réussite. Les ornements des ports restent dans les limites du dessin. Après la victoire, la sélection du dernier fragment disparaît et le bouton de continuation utilise le ruban du jeu, avec un libellé sur une ligne ajusté à la largeur disponible.

Chaque nouveau type de pièce ouvre une explication concise avant le premier geste ; seul « J’ai compris » mémorise la carte affichée. Le rappel « Les règles du vitrail » reste disponible. La découverte est conservée d’un jour à l’autre dans le carnet.

Tous les gestes sont réversibles. Annuler, recommencer et demander un indice sont gratuits. Un indice indique une rotation vers le certificat enregistré ; suivre ces indices mène toujours à une victoire, y compris depuis des choix arbitraires. Le joueur peut aussi réussir avec une autre disposition acceptée par le moteur. La dernière tentative et ses 200 dernières rotations sont conservées lors d’une fermeture.

## Récompense et archives

Les trois défis se débloquent dans l’ordre. Finir le premier ou le deuxième donne **zéro graine**. Finir les trois donne **une graine**, une fois pour la date courante. Le crédit et le drapeau `rewarded` sont écrits ensemble dans la sauvegarde habituelle. Rejouer, annuler après une victoire, recommencer, changer de jour ou recharger la sauvegarde ne réattribue pas une graine déjà gagnée.

Le calendrier conserve le nombre de vitraux terminés pour chaque date. Les feuillets passés restent rejouables sans récompense. Une dernière victoire après minuit sur l’ancien trio reste enregistrée, mais ne donne pas la graine du nouveau jour. Les dates futures ne sont pas ouvertes. Les sessions d’essai de la campagne n’attribuent aucune progression journalière. Comme le reste du jeu actuel, l’horloge et la sauvegarde sont locales ; ce mode n’est pas un registre de transactions en ligne.

Le champ optionnel `vitrail` possède son propre format `version: 1`. Les anciens carnets n’ont rien à migrer. Le modèle vérifie les dates, les étapes débloquées, les orientations, l’historique et le registre des récompenses au rechargement. Une remise à zéro du carnet efface aussi cette progression.

Après le 17 novembre 2027, le mode indique que de nouveaux feuillets sont en préparation et conserve les archives : **aucune grille n’est recyclée**. Une mise à jour doit prolonger la réserve avant cette date. `node --import tsx scripts/generate-vitrails.ts 730` complète la banque jusqu’à 730 jours sans remplacer les grilles déjà publiées. Sans argument, le script conserve les 365 journées existantes. Ne jamais remplacer une date publiée ou ses certificats ; étendre les tests de plage lors d’un ajout.

## Vérification

`tests/vitrail.test.ts` contrôle les 1 095 certificats et leur unicité, les trois paliers, les mélanges et croisements, les boucles, les indices depuis d’autres dispositions, le gain unique après trois défis, les rechargements, le changement de date, les archives et la compatibilité des sauvegardes.

`GAME_TEST_URL=http://localhost:8126/ node --import tsx scripts/vitrail-smoke.ts` joue les vrais boutons depuis l’accueil, les trois introductions, la reprise exacte, l’annulation, les indices, le trio complet, le rejeu, le calendrier, le renouvellement dans un écran ouvert et un deuxième trio sans réseau. Il vérifie quatre formats, des cibles de rotation d’au moins 44 pixels, les graines et la conservation de la campagne et des jardins.

`GAME_TEST_URL=http://localhost:8126/ node --import tsx scripts/vitrail-rendering-smoke.ts` contrôle les halos avant et après la victoire, la conservation de la couleur attendue sous une mauvaise lumière, les ornements aux bords et le libellé complet du calendrier sur quatre formats. Il reproduit aussi le dernier geste d’une victoire pour vérifier que le cadre de sélection disparaît.

`tests/vitrail-layout.test.ts` passe les 1 095 grilles sur 19 formats et deux tailles de texte, avec contrôle des limites et des emplacements des commandes. `GAME_TEST_URL=http://localhost:8126/ node --import tsx scripts/vitrail-fit-smoke.ts` vérifie aussi l’écran réel sur les trois difficultés au début, au milieu et à la fin de la réserve, en jeu avec un indice puis après victoire : aucun défilement de page, aucune commande hors écran, aucun libellé tronqué et prise en compte d’une réduction de hauteur pour les zones système.

Ce parcours vérifie également les marges réelles du papier, l’écart entre la grille, son message et les commandes, le centrage du groupe et le retrait des boutons du calendrier par rapport aux bords de leur bandeau.
