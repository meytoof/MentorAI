# 🧠 Système de Contexte Conversationnel

## ✅ Ce qui a été implémenté

### 1. **Base de données - Modèle Conversation**

- Nouveau modèle Prisma `Conversation` pour stocker l'historique
- Relation avec `User` (chaque utilisateur a ses propres conversations)
- Stockage : question, hint, drawing (JSON), encouragement, timestamp
- Index sur `userId` et `createdAt` pour des requêtes rapides

### 2. **API `/api/assist` - Contexte intelligent**

- ✅ **Authentification** : Vérifie que l'utilisateur est connecté
- ✅ **Historique** : Récupère les 10 dernières conversations de l'utilisateur
- ✅ **Contexte utilisateur** : Utilise le nom et le profil TDAH pour personnaliser
- ✅ **Canvas** : Reçoit l'image du canvas actuel (base64) pour voir ce que l'enfant a dessiné
- ✅ **Sauvegarde** : Enregistre chaque conversation pour construire l'historique

### 3. **Prompt système amélioré**

Le prompt a été complètement réécrit pour renforcer le rôle de professeur :

- Identité claire : "professeur d'aide aux devoirs bienveillant"
- Méthode socratique explicite
- Adaptation au niveau de l'enfant
- Continuité pédagogique avec les conversations précédentes
- Référence au dessin de l'enfant si présent

### 4. **Frontend - Envoi du canvas**

- Fonction `getCanvasAsImage()` qui capture le canvas en PNG (base64)
- Détection intelligente : n'envoie que si le canvas contient du contenu
- Compression à 80% pour réduire la taille
- Envoi automatique avec chaque question

---

## 🔄 Flux de fonctionnement

```
1. L'enfant pose une question (optionnellement après avoir dessiné)
   ↓
2. Frontend capture le canvas actuel (si contenu)
   ↓
3. API récupère :
   - Session utilisateur
   - 10 dernières conversations
   - Infos utilisateur (nom, TDAH)
   - Image du canvas
   ↓
4. Construction du prompt avec :
   - Prompt système (rôle professeur)
   - Contexte utilisateur
   - Historique des conversations
   - Référence au canvas
   - Nouvelle question
   ↓
5. Appel Ollama avec contexte complet
   ↓
6. Réponse IA avec hint + drawing + encouragement
   ↓
7. Sauvegarde de la conversation en BDD
   ↓
8. Affichage + dessin automatique (si activé)
```

---

## 🎯 Avantages du système

### **Continuité pédagogique**

- L'IA se souvient des conversations précédentes
- Évite de répéter les mêmes explications
- Construit progressivement sur ce qui a été appris
- Adapte sa pédagogie selon ce qui fonctionne

### **Personnalisation**

- Utilise le prénom de l'enfant
- Adaptation spéciale pour profil TDAH (instructions plus courtes, pauses visuelles)
- Référence au dessin de l'enfant pour guider visuellement

### **Rôle de professeur renforcé**

- Prompt système détaillé qui maintient le rôle
- Méthode socratique systématique
- Bienveillance et encouragement constants
- Jamais de réponse directe, toujours de la guidance

---

## 📊 Exemple de contexte envoyé à l'IA

```
SYSTEM_PROMPT (rôle professeur)
+
INFORMATIONS SUR L'ENFANT :
- Prénom : Emma
- Profil TDAH : Oui - Adapte ta pédagogie...
+
CONTEXTE DES CONVERSATIONS PRÉCÉDENTES :
Conversation 1 (08/01/2025):
Question: Résous 12 + 7
Ton indice: Commence par représenter le nombre 12...

Conversation 2 (08/01/2025):
Question: Et 15 + 8 ?
Ton indice: Tu as bien compris l'addition ! Maintenant...
+
L'enfant a déjà dessiné quelque chose sur le tableau...
+
NOUVELLE QUESTION : Résous 20 + 5
```

---

## 🔧 Configuration

Aucune configuration supplémentaire nécessaire ! Le système :

- Utilise automatiquement l'authentification existante
- Crée les tables nécessaires via Prisma
- Fonctionne avec ou sans historique (première conversation)

---

## 🚀 Prochaines améliorations possibles

1. **Limite de contexte** : Limiter à X tokens pour éviter les prompts trop longs
2. **Résumé de contexte** : Si trop de conversations, créer un résumé
3. **Sessions** : Grouper les conversations par "session de travail"
4. **Analyse du canvas** : Utiliser une vision AI pour analyser le dessin
5. **Feedback utilisateur** : Permettre à l'enfant de dire si l'aide était utile

---

## 📝 Notes techniques

- **Base de données** : SQLite (peut être migré vers PostgreSQL pour la prod)
- **Limite historique** : 10 dernières conversations (configurable)
- **Taille canvas** : Image PNG compressée à 80%
- **Sécurité** : Chaque utilisateur ne voit que ses propres conversations

