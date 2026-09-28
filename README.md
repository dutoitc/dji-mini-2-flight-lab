# DJI Mini 2 Flight Lab

Simulateur 3D pédagogique au clavier, inspiré du pilotage stabilisé d'un DJI Mini 2. Projet indépendant, non affilié à DJI. Le comportement est une approximation pédagogique, pas une reproduction certifiée de son contrôleur de vol.

## Utilisation

Espace ou **Décoller**, puis W/S pour monter/descendre, A/D pour le lacet, flèches pour les translations relatives au drone. Les positions physiques WASD sont utilisées (clavier suisse compris).

- **1 / 2 maintenus** : baisser / relever la caméra de -90° à +20°.
- **C** : caméra embarquée / poursuite.
- **§** (ou touche Backquote) : vue externe dessus / dessous. Ce sont des vues pédagogiques, pas des capacités de la nacelle réelle.
- **L** : atterrissage automatique à la position actuelle, sans évitement d'obstacles.
- **P** : pause ; la perte de focus met aussi le vol en pause.
- **R** : réinitialiser au départ.

650 arbres, collines procédurales déterministes, collisions de terrain et arbres, inertie et freinage assisté, décollage progressif, atterrissage doux ou crash, position locale est/nord, cap, hauteur au-dessus du terrain, distance directe au départ et trajet cumulé. Limites propres au simulateur : rayon 650 m et plafond 120 m dans le repère de départ. Atmosphère calme, aucun vent simulé. Batterie illustrative de 25 minutes avec atterrissage sous 10 %.

## Développement

Sans build ni clé API. Three.js 0.170.0 est chargé par CDN (connexion requise). Polices Google externes avec police de repli.

```sh
python3 -m http.server 8080
npm test
```

Ouvrir http://localhost:8080. WebGL et accélération graphique requis. Tests Node pour vol stationnaire, axes de commande, freinage, atterrissage et collisions.

## GitHub Pages

Dans Settings → Pages, sélectionner **GitHub Actions** si la configuration automatique n'est pas autorisée. Le workflow publie uniquement les fichiers du site après les tests.
