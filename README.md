# 🧠 MemoVox – Assistant Personnel Vocal

MemoVox est une application mobile intelligente qui vous aide à gérer vos tâches et rendez-vous à la voix, tout en recevant chaque matin un résumé personnalisé.

## 📱 Fonctionnalités clés

- 🎙 Ajout vocal de tâches et de rendez-vous (Speech-to-Text)
- ✅ Gestion des tâches (ajout, édition, suppression, statut)
- 📆 Gestion des rendez-vous (date, heure, lieu, récurrence)
- 🔔 Notifications automatiques
- 🗓 Résumé quotidien vocal ou textuel
- 📤 Sauvegarde des données dans le cloud via Supabase
- 👤 Authentification sécurisée (email / OAuth)

---

## 🛠️ Stack technique

| Composant       | Technologie                |
|-----------------|----------------------------|
| Frontend        | Flutter (Dart)             |
| Backend         | Supabase (PostgreSQL + Auth + Storage) |
| Speech-to-Text  | `speech_to_text` plugin    |
| Notifications   | `flutter_local_notifications` |
| Calendrier      | `table_calendar` ou `syncfusion_flutter_calendar` |
| Gestion d’état  | `Riverpod` (ou `Bloc`)     |

---

## 🚀 Mise en place

1. **Prérequis** : installez [Flutter](https://docs.flutter.dev/get-started/install) et, pour le développement local, la [CLI Supabase](https://supabase.com/docs/guides/cli).
2. Clonez ce dépôt puis récupérez les dépendances :
   ```bash
   flutter pub get
   ```
3. (Facultatif) Lancez une instance Supabase locale et appliquez les migrations :
   ```bash
   supabase start
   supabase db reset
   ```

## 🏗️ Compilation et exécution

- Démarrage sur appareil ou émulateur mobile :
  ```bash
  flutter run
  ```
- Lancement dans le navigateur :
  ```bash
  flutter run -d chrome
  ```
- Construction d'un APK Android :
  ```bash
  flutter build apk
  ```
- Lancement des tests :
  ```bash
  flutter test
  ```

## 🤝 Contribuer

1. Ouvrez une issue ou choisissez-en une existante avant de commencer.
2. Créez une branche dédiée et veillez à respecter les règles de style définies dans `analysis_options.yaml`.
3. Exécutez `flutter test` pour valider que tout passe avant de soumettre votre *pull request*.
