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