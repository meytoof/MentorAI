# 🧠 Brainstorming : Intégration IA avec Dessin Automatique

## 🎯 Objectifs
1. Connecter Ollama pour générer des indices pédagogiques
2. Permettre à l'IA de dessiner automatiquement dans le canvas
3. Utiliser des couleurs pour différencier les types d'aide visuelle

---

## 💡 Approches possibles

### **Approche 1 : Instructions de dessin structurées (JSON)**
L'IA retourne des instructions de dessin en JSON que le frontend interprète.

**Avantages :**
- ✅ Contrôle total sur le rendu
- ✅ Performances optimales
- ✅ Facile à déboguer
- ✅ Peut être sauvegardé/rejoué

**Format proposé :**
```json
{
  "hint": "Réfléchis par étapes...",
  "drawing": {
    "steps": [
      {
        "type": "line",
        "color": "#3b82f6", // bleu pour les indices
        "points": [[100, 100], [200, 150], [300, 200]],
        "width": 2
      },
      {
        "type": "circle",
        "color": "#10b981", // vert pour les solutions partielles
        "center": [250, 250],
        "radius": 50,
        "fill": false
      },
      {
        "type": "text",
        "color": "#f59e0b", // orange pour les annotations
        "text": "Étape 1",
        "x": 100,
        "y": 80,
        "fontSize": 16
      }
    ]
  }
}
```

---

### **Approche 2 : Canvas Drawing Commands**
L'IA génère des commandes de dessin Canvas API directement.

**Avantages :**
- ✅ Plus flexible
- ✅ Peut utiliser toutes les fonctions Canvas

**Inconvénients :**
- ⚠️ Moins sécurisé (nécessite validation)
- ⚠️ Plus complexe à parser

---

### **Approche 3 : SVG Path + Conversion**
L'IA génère des chemins SVG que l'on convertit en dessins Canvas.

**Avantages :**
- ✅ Format standard
- ✅ Facile à manipuler

**Inconvénients :**
- ⚠️ Conversion nécessaire
- ⚠️ Moins performant

---

## 🎨 Système de couleurs proposé

| Couleur | Usage | Code Hex | Signification |
|---------|-------|----------|---------------|
| 🔵 Bleu | Indices généraux | `#3b82f6` | "Réfléchis ici" |
| 🟢 Vert | Solutions partielles | `#10b981` | "Tu es sur la bonne voie" |
| 🟡 Jaune | Points importants | `#f59e0b` | "Attention à ceci" |
| 🔴 Rouge | Erreurs à corriger | `#ef4444` | "Vérifie cela" |
| 🟣 Violet | Encouragements | `#a855f7` | "Continue comme ça !" |
| ⚪ Blanc | Dessin utilisateur | `#f3f4f6` | (couleur actuelle) |

---

## 🤖 Prompt Engineering pour Ollama

### Prompt système recommandé :
```
Tu es un assistant pédagogique pour enfants. Ton rôle est de guider vers la solution SANS donner la réponse directement.

Règles strictes :
1. Ne JAMAIS donner la réponse finale
2. Donne des indices par étapes (méthode socratique)
3. Encourage la réflexion autonome
4. Adapte-toi au niveau de l'enfant
5. Utilise des exemples visuels quand possible

Pour les questions mathématiques :
- Aide à identifier les données importantes
- Suggère des schémas ou dessins
- Guide vers la méthode appropriée
- Encourage à vérifier le résultat

Format de réponse attendu (JSON) :
{
  "hint": "Texte de l'indice",
  "drawing": {
    "steps": [
      {
        "type": "line|circle|rectangle|text|arrow",
        "color": "#3b82f6",
        "data": {...}
      }
    ]
  },
  "encouragement": "Message d'encouragement optionnel"
}
```

---

## 🏗️ Architecture proposée

### Backend (`/api/assist`)
1. Reçoit la question + contexte (optionnel : image du canvas actuel)
2. Appelle Ollama avec prompt structuré
3. Parse la réponse JSON
4. Valide et sécurise les instructions de dessin
5. Retourne la réponse structurée

### Frontend (`whiteboard/page.tsx`)
1. Envoie la question à l'API
2. Reçoit la réponse avec instructions de dessin
3. Affiche le texte de l'indice
4. **Optionnel** : Dessine automatiquement les éléments visuels
5. Permet à l'utilisateur de continuer à dessiner par-dessus

---

## 🎯 Fonctionnalités à implémenter

### Phase 1 : Base
- [x] Connexion Ollama
- [ ] Parsing JSON des instructions de dessin
- [ ] Fonction de dessin automatique dans le canvas
- [ ] Système de couleurs

### Phase 2 : Améliorations
- [ ] Animation progressive du dessin (effet "écriture")
- [ ] Bouton pour activer/désactiver le dessin auto
- [ ] Sauvegarde du dessin utilisateur avant dessin IA
- [ ] Possibilité d'effacer uniquement le dessin IA
- [ ] Historique des indices avec rejouer

### Phase 3 : Avancé
- [ ] Analyse du dessin utilisateur (OCR/vision)
- [ ] Suggestions basées sur ce que l'enfant a dessiné
- [ ] Mode "pas à pas" avec validation à chaque étape
- [ ] Personnalisation selon le profil TDAH

---

## 🔧 Implémentation technique

### 1. Fonction de dessin automatique
```typescript
function drawAIDrawing(ctx: CanvasRenderingContext2D, steps: DrawingStep[]) {
  steps.forEach((step, index) => {
    setTimeout(() => {
      switch (step.type) {
        case 'line':
          drawLine(ctx, step);
          break;
        case 'circle':
          drawCircle(ctx, step);
          break;
        // ...
      }
    }, index * 200); // Animation progressive
  });
}
```

### 2. Gestion des couches
- Couche utilisateur (dessin manuel)
- Couche IA (dessin automatique)
- Possibilité de masquer/afficher chaque couche

### 3. Sécurité
- Validation stricte des coordonnées (limites canvas)
- Sanitization des données JSON
- Rate limiting sur l'API

---

## 📊 Exemples de cas d'usage

### Mathématiques : Addition
**Question :** "Résous 12 + 7"

**Réponse IA :**
- Indice texte : "Commence par représenter le nombre 12 visuellement"
- Dessin : 12 cercles bleus groupés par 10 + 2
- Puis : 7 cercles verts à ajouter
- Annotation : "Combien au total ?"

### Géométrie : Périmètre
**Question :** "Calcule le périmètre d'un rectangle de 5cm sur 3cm"

**Réponse IA :**
- Dessin : Rectangle avec dimensions
- Flèches colorées montrant chaque côté
- Indice : "Additionne tous les côtés"

---

## 🚀 Prochaines étapes

1. ✅ Brainstorming (ce document)
2. ⏭️ Implémenter l'intégration Ollama
3. ⏭️ Créer le système de dessin automatique
4. ⏭️ Tester avec différents types de questions
5. ⏭️ Améliorer le prompt pour de meilleurs résultats



