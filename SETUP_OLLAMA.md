# 🚀 Configuration Ollama pour l'IA

## Installation d'Ollama

1. **Télécharger Ollama** : https://ollama.ai/download
2. **Installer** selon votre système d'exploitation
3. **Démarrer Ollama** (il démarre automatiquement en service)

## Télécharger un modèle

Pour utiliser l'IA, vous devez télécharger un modèle. Recommandations :

```bash
# Modèle léger et rapide (recommandé pour commencer)
ollama pull llama3.2

# Modèle plus puissant (nécessite plus de RAM)
ollama pull llama3.1

# Modèle spécialisé pour le français
ollama pull mistral
```

## Configuration dans le projet

Ajoutez ces variables dans votre fichier `.env` :

```env
# URL d'Ollama (par défaut : http://localhost:11434)
OLLAMA_URL=http://localhost:11434

# Modèle à utiliser (doit correspondre à un modèle téléchargé)
OLLAMA_MODEL=llama3.2
```

## Vérifier que Ollama fonctionne

```bash
# Tester Ollama directement
ollama run llama3.2 "Bonjour, peux-tu m'aider ?"

# Ou via curl
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Bonjour"
}'
```

## Dépannage

### Ollama ne répond pas

- Vérifiez que le service Ollama est démarré
- Vérifiez le port 11434 : `curl http://localhost:11434/api/tags`

### Le modèle n'est pas trouvé

- Liste les modèles installés : `ollama list`
- Téléchargez le modèle manquant : `ollama pull <nom-du-modèle>`

### Erreurs de mémoire

- Utilisez un modèle plus petit (llama3.2 au lieu de llama3.1)
- Réduisez la taille du contexte dans le code si nécessaire

## Mode développement sans Ollama

Si Ollama n'est pas disponible, l'API `/api/assist` utilisera automatiquement un fallback avec des indices génériques. L'application fonctionnera toujours, mais sans l'intelligence artificielle.

---

## 🌐 Utiliser Ollama avec un front déployé sur Vercel

### Important : Ollama ne tourne pas sur Vercel

- Vercel ne permet pas d’installer et d’exécuter Ollama directement sur leurs fonctions serverless.
- **Conclusion** : Ollama doit tourner **ailleurs** (chez toi ou sur un serveur dédié), et ton app Next.js (sur Vercel) doit juste l’appeler via HTTP.

### 1. Scénario simple : Vercel (front) + Ollama chez toi (dev perso)

En prod Vercel, `localhost` ne marche plus, car `localhost` pointerait vers les serveurs Vercel, pas ta machine.

1. Fais tourner Ollama chez toi (comme en dev).
2. Expose ton Ollama de manière sécurisée (recommandation : via un tunnel ou un reverse proxy avec auth, pas directement sur Internet).
3. Mets une URL accessible publiquement dans les variables d’environnement Vercel :

Dans Vercel → _Project Settings_ → _Environment Variables_ :

```env
OLLAMA_URL=https://ton-domaine-ou-tunnel.exemple.com
OLLAMA_MODEL=llama3.2
```

Dans ton `.env.local` (pour dev) tu peux garder :

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 2. Scénario plus propre : backend dédié pour Ollama

Architecture recommandée :

- **Vercel** : héberge uniquement le front Next.js (ton app actuelle).
- **Server dédié / VPS / machine chez toi** : fait tourner Ollama + éventuellement une petite API Node/Express, FastAPI, etc.

Le flux devient :

1. Front (Vercel) → appelle `/api/assist` (route Next.js).
2. `/api/assist` → appelle ton backend Ollama (URL dans `OLLAMA_URL`).
3. Ton backend parle à Ollama, renvoie la réponse JSON à `/api/assist`, qui la renvoie au front.

Avantages :

- Tu maîtrises l’hébergement d’Ollama (RAM, GPU, sécurité).
- Tu peux mettre de l’auth, du rate limiting, des logs, etc. devant Ollama.

### 3. Sécuriser l’accès à Ollama

**À éviter absolument :**

- Exposer `http://ton-ip:11434` brut sur Internet sans protection.

**À faire :**

- Mettre un reverse proxy (NGINX, Caddy, Traefik…) devant Ollama.
- Ajouter au minimum :
  - Auth par token/API key
  - HTTPS (Let’s Encrypt)
  - Limite d’IP ou VPN si possible

Exemple (idée de base côté Next.js) :

- Ajouter une variable secrète côté Vercel :

```env
OLLAMA_API_KEY=un_token_que_tu_verifies_cote_serveur
```

- Et ne transmettre ce token qu’entre `/api/assist` et ton backend Ollama (jamais au navigateur).

### 4. Résumé local vs Vercel

- **Dev local :**

  - Ollama tourne sur ta machine.
  - `.env.local` :
    - `OLLAMA_URL=http://localhost:11434`
    - `OLLAMA_MODEL=llama3.2`

- **Prod Vercel :**
  - Front sur Vercel.
  - Ollama sur une autre machine/serveur.
  - Variables Vercel :
    - `OLLAMA_URL=https://ton-backend-ollama.exemple.com`
    - `OLLAMA_MODEL=llama3.2`
    - `OLLAMA_API_KEY=...` (optionnel mais recommandé)

Si tu veux, je peux aussi te proposer une petite API Node (ou autre) prête à déployer sur un VPS pour servir d’interface propre entre Vercel et Ollama.
