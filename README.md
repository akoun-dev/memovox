# 📱 MemoVox – Assistant Personnel Vocal & Agenda Intelligent

MemoVox est une application mobile développée avec **Flutter** et **Supabase**, permettant à l'utilisateur de gérer ses tâches et rendez-vous à l’aide de la **voix**. Elle offre également des rappels, un résumé quotidien vocal et une interface fluide pour mieux organiser son quotidien.

---

## 🚀 Fonctionnalités Principales

- 🎙️ **Ajout vocal intelligent** : dictée des tâches ou rendez-vous
- ✅ **Gestion des tâches** : création, édition, suppression, marquage
- 📆 **Agenda & rendez-vous** : vue calendrier, rappels, répétition
- 🔔 **Notifications locales & rappels** : pour ne rien oublier
- 🗣️ **Résumé vocal quotidien** : via synthèse vocale
- ☁️ **Sauvegarde cloud via Supabase** : base PostgreSQL sécurisée
- 👤 **Connexion utilisateur** : email, Google, GitHub via Supabase Auth

---

## 🛠️ Stack Technique

| Composant       | Technologie                           |
|------------------|---------------------------------------|
| Frontend         | Flutter                               |
| Backend          | Supabase                              |
| Authentification | Supabase Auth                         |
| Base de données  | Supabase Database (PostgreSQL)        |
| STT              | `speech_to_text`                      |
| TTS              | `flutter_tts`                         |
| Notifications    | `flutter_local_notifications`         |
| Stockage Cloud   | Supabase Storage (pour les audios)    |
| Gestion d’état   | Riverpod / Bloc / Provider (au choix) |

---

## 📁 Structure du projet (exemple recommandé)

```
lib/
├── main.dart
├── core/                 # Constantes, services communs, thèmes
├── features/
│   ├── auth/             # Authentification
│   ├── tasks/            # Gestion des tâches
│   ├── appointments/     # Gestion des rendez-vous
│   ├── voice/            # STT et TTS
│   └── home/             # Page d'accueil + résumé journalier
├── services/             # Intégration Supabase, Notifs, etc.
└── widgets/              # Composants réutilisables
```

---

## 🚧 État actuel du projet

Cette version fournit une base fonctionnelle comprenant :

- l'initialisation de Supabase via `SupabaseService` ;
- la gestion d'une liste de tâches persistée dans la table `tasks` ;
- un écran d'accueil permettant d'afficher et d'ajouter des tâches avec Riverpod.

---

## 🔧 Installation locale

### 1. Prérequis
- Flutter ≥ 3.19
- Un compte Supabase (https://supabase.io/)
- Clé API Supabase + URL du projet

### 2. Cloner le projet

```bash
git clone https://github.com/votre-utilisateur/memovox-flutter.git
cd memovox-flutter
flutter pub get
```

### 3. Configurer Supabase

Créer un fichier `.env` à la racine du projet :

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Installez le package `flutter_dotenv` pour charger les variables d’environnement.

---

## ▶️ Lancer l'application

```bash
flutter run
```

---

## 🔄 Fonctionnalités à venir

- 🔁 Synchronisation Google Calendar
- 🧠 Résumé contextuel IA (Whisper + GPT)
- 🔊 Détection automatique du langage
- 📊 Statistiques d’utilisation

---

## 👤 Contributeur principal

- **Akoun Bernard Aboa** – Développeur Flutter & architecte système

---

## 📜 Licence

Projet sous licence MIT.  
Vous pouvez le modifier, le distribuer, et l’utiliser librement.