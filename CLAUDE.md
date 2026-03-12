# Charte Graphique & Standards UI (Application Web)

## Identite Visuelle (Vercel / Minimalist App Style)
L'esthetique globale est minimaliste, a fort contraste et epuree, optimisee pour des interfaces logicielles (mini-apps, dashboards). L'interface est strictement monochrome avec des bordures extremement subtiles, une typographie resserree et une hierarchie claire. Support natif des themes Light et Dark.

## Principes Fondamentaux du Design
1. Le contenu est roi : Utiliser un contraste eleve pour faire de la donnee le point focal principal.
2. Structure par le vide et la grille : Utiliser genereusement les espaces blancs bases sur un systeme strict de 8px (8, 16, 24, 32, 48, 64...) et des lignes de 1px. Aucun bloc de couleur lourd.
3. Typographie "Engineered" : Garder une typographie serree en utilisant un espacement negatif des lettres (letter-spacing) sur les titres pour un aspect technique.
4. Accessibilite et Etats : Les etats interactifs (Focus, Hover, Active, Disabled) doivent toujours etre visuellement evidents.
5. Elevation sans ombre : Privilegier le flou d'arriere-plan (backdrop-blur) et les bordures pour detacher les elements flottants (modales, menus) plutot que de grosses ombres.
6. Perception de vitesse : L'application doit paraitre instantanee via des animations courtes et l'utilisation de skeleton loaders.

## Palette de Couleurs
L'interface repose sur le noir et blanc pur, ajuste pour eviter la fatigue visuelle.
- Background : #FFFFFF (Light) / #000000 (Dark) / Secondaire : #FAFAFA (Light) ou #0A0A0A (Dark).
- Texte : #000000 (Light) / #EDEDED (Dark - adouci pour la lecture) / Secondaire : #666666 (Light) ou #888888 (Dark).
- Bordures : Subtiles #EAEAEA (Light) ou #333333 (Dark) / Fortes (Focus) #000000 (Light) ou #FFFFFF (Dark).
- Couleurs Semantiques : Succes #0070F3, Erreur #EE0000, Attention #F5A623.

## Typographie & Iconographie
Le systeme typographique est calibre pour une interface d'application (dense mais lisible).
- Polices : Geist, system-ui, -apple-system, sans-serif (Corps) / Geist Mono, Menlo, monospace (Code/Data).
- Titre Application (H1) : 36px a 48px, font-weight 700, line-height 1.1, tracking -0.04em.
- Titre de Section (H2) : 24px a 32px, font-weight 600, line-height 1.2, tracking -0.03em.
- Titre de Carte/Module (H3) : 18px a 20px, font-weight 600, line-height 1.3, tracking -0.02em.
- Corps de texte : 16px (Defaut) ou 14px (Small), line-height 1.5, couleur texte secondaire.
- Label / Surtitre : 12px, majuscules (uppercase), font-weight 500, tracking 0.05em (espace), couleur texte secondaire.
- Iconographie : Utiliser exclusivement la bibliotheque Lucide Icons ou Radix Icons. Toujours utiliser des icones en ligne (stroke), jamais remplies (fill), avec une epaisseur de trait (stroke-width) constante de 1.5px ou 2px.

## Composants UI & Etats

### Boutons
Contraste pur, arrondis en pilule (rounded-full), padding 8px 16px (Small) ou 12px 24px (Default), font-weight 500.
- Primaire : Fond texte principal / Texte background principal.
- Secondaire : Fond transparent / Texte couleur principale / Bordure 1px solid border-subtle.
- Etats interactifs : Hover (legere variation d'opacite), Active (scale-95), Focus-visible (ring-2 ring-offset-2 ring-black/white), Disabled (opacite 50%, not-allowed).

### Formulaires (Inputs, Selects, Textareas)
- Style par defaut : Fond transparent ou tres legerement grise (#FAFAFA / #0A0A0A), bordure 1px border-subtle, radius 6px ou 8px.
- Etat Focus : Bordure devient forte (border-strong) avec anneau de focus (ring-1 ring-black/white) pour l'accessibilite.

### Bordures, Ombres & Elevation
- Ombres : Presque inexistantes. Hover de carte tres leger : 0 4px 12px rgba(0, 0, 0, 0.05).
- Bordures : Lignes grises tres fines (1px solid var(--border-subtle)).
- Rayons (Radius) : Cartes 12px, Inputs/Boutons carres 8px, Badges 6px, Boutons ronds 9999px.
- Elevation : Utiliser un fond semi-transparent couple a un flou (backdrop-blur-md bg-white/80 ou bg-black/80) et une bordure border-subtle pour detacher l'element.

### Etats de Chargement (Loading States)
- Règle stricte : Ne jamais utiliser de simples "spinners" de chargement occupant tout l'ecran.
- Solution : Utiliser systematiquement des Skeleton Loaders (animate-pulse) reprenant la forme geometrique exacte du contenu en attente (blocs gris subtils avec le meme border-radius que l'element final).

## Layout, Espacement & Comportement Responsive
- Regle d'or : Toujours utiliser des multiples de 8px (ex: gap-4 = 16px, p-6 = 24px en Tailwind).
- Grille Desktop : 12 colonnes avec espace entre les elements (gap) de 16px ou 24px. Largeur max 1200px.
- Mobile-First (Degradation gracieuse) : 
  - Reduire le padding global de 24px (Desktop) a 16px (Mobile).
  - Convertir les fenetres Modales classiques en Bottom Sheets (tiroirs glissant depuis le bas de l'ecran) sur les ecrans mobiles.

## Motion Design & Animations
L'interface doit etre vive et reactive ("snappy") sans jamais faire attendre l'utilisateur.
- Micro-interactions (Hover, Focus) : Tres rapide (150ms), courbe ease-out (ex: duration-150 ease-out).
- Entrees/Sorties (Modales, Notifications) : Court (200ms a 300ms) avec un effet fade-in et leger slide-up (vers le haut), ou un effet de ressort subtil (spring/cubic-bezier).
