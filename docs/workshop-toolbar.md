# Bandeau ivoire de l’atelier

La deuxième proposition approuvée harmonise les commandes du puzzle avec la navigation du menu : capsule ivoire, filet doré, légère texture de papier, icônes botaniques dessinées et libellés verts droits en Alegreya Sans Medium. Les quatre images transparentes sont préparées depuis l’atlas original conservé dans `art/workshop-actions/`, puis exportées en WebP de 256 pixels dans `assets/workshop-actions/`.

`WorkshopActionBar` reçoit les actions et leur disponibilité depuis l’atelier ; les fonctions Annuler, Recommencer, Mélanger et Indice restent celles de la partie. Les noms accessibles sont conservés, les commandes indisponibles sont désactivées et atténuées, et une pression ajoute seulement une légère teinte sauge. Aucune animation permanente n’est ajoutée.

Le calcul partagé de l’atelier conserve une barre de 96 points à l’échelle standard. Les icônes occupent 40 points, ou 32 dans les formats compacts, avec des zones tactiles d’au moins 44 points. Les marges et la taille des libellés s’adaptent à la largeur ; les textes restent sur une ligne et suivent le plafond d’agrandissement existant. Le paysage très étroit garde les icônes seules avec leur nom accessible, comme précédemment. Le plateau conserve son espace disponible.

Vérifications : calculs de disposition de tous les niveaux sur quinze formats et plusieurs tailles de texte, ainsi que parcours navigateur ciblé sur dix formats, dont page 32, page 1000 et paysage. Le parcours vérifie la lisibilité sans troncature, les quatre zones tactiles distinctes, les images chargées, l’absence de défilement, l’alignement des libellés, les états désactivés et les actions réelles (annulation, redémarrage, indice gratuit, annulation et confirmation du mélange).
