# Sceau enchanté des mouvements impossibles

Le troisième style approuvé remplace la grande feuille verte : lavis ivoire légèrement lavande, branches botaniques à l’aquarelle, fin contour doré et deux petits fleurons. Le texte reste un vrai texte accessible, en Alegreya italique, avec des marges intérieures et une hauteur qui suit les messages plus longs des mécanismes avancés.

`MistakeSeal` est un calque sans interception des touches au-dessus du plateau. Il ne change ni les règles, ni les messages, ni la sauvegarde, ni la place des flacons et des commandes. La durée de lecture reste de 5,8 secondes ; une action du joueur, une demande d’indice ou un changement de page peut l’effacer immédiatement. Une nouvelle erreur remplace et démonte le précédent effet.

Deux masques opposés révèlent les arcs dorés en moins d’une seconde. Six lucioles discrètes scintillent et dérivent autour du cadre. Le texte ne tourne pas et ne se déplace pas. Une seule chronologie native commande les opacités et transformations ; les tracés SVG et le dessin WebP restent fixes. Aucun filtre SVG, minuteur par image ou boucle perpétuelle n’est ajouté. La chronologie animée reprend après un passage en arrière-plan avec le contrôleur existant.

Le réglage sans animations affiche directement le décor complet, sans lucioles ni mouvements. L’illustration originale approuvée est conservée dans `art/feedback/`, et sa version WebP transparente de 1440 px dans `assets/feedback/`. Le texte et le contour ne sont pas intégrés à l’image.

Le parcours `npm run test:mistake` vérifie les versements impossibles, les erreurs successives, la stabilité du texte et du plateau, la sauvegarde inchangée, les indices et redémarrages, la navigation, le mode sans animations, les petits téléphones, le paysage, la tablette et des messages de filtres/collecteurs ainsi que la page 1000. Le changement utilise les dépendances natives existantes et peut être livré par mise à jour Expo à l’APK 1.0.3.
