import 'package:flutter/material.dart';
import 'package:line_icons/line_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final userEmail = Supabase.instance.client.auth.currentUser?.email ?? 'Utilisateur';

    return Drawer(
      child: Column(
        children: [
          Center(
            child: UserAccountsDrawerHeader(
              accountName: const Text('MemoVox'),
              accountEmail: Text(userEmail),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(LineIcons.user, color: Colors.indigo, size: 30),
              ),
              decoration: const BoxDecoration(color: Colors.indigo),
            ),
          ),

          // Menu items
          _buildItem(context, icon: LineIcons.businessTime, title: "Aujourd'hui", route: '/today'),
          // _buildItem(context, icon: LineIcons.barChart, title: 'Tableau de bord', route: '/dashboard'),
          _buildItem(context, icon: LineIcons.tasks, title: 'Tâches', route: '/tasks'),
          _buildItem(context, icon: LineIcons.calendar, title: 'Rendez-vous', route: '/appointments'),
          _buildItem(context, icon: LineIcons.cogs, title: 'Paramètres', route: '/settings'),

          const Spacer(),

          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Se déconnecter'),
            onTap: () => _confirmLogout(context),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(BuildContext context, {required IconData icon, required String title, required String route}) {
    return ListTile(
      leading: Icon(icon, color: Colors.indigo),
      title: Text(title),
      onTap: () {
        Navigator.pop(context); // ferme le drawer
        Navigator.pushReplacementNamed(context, route);
      },
    );
  }

  Future<void> _confirmLogout(BuildContext context) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirmation'),
          content: const Text('Voulez-vous vraiment vous déconnecter ?'),
          actions: <Widget>[
            TextButton(
              child: const Text('Annuler'),
              onPressed: () => Navigator.of(context).pop(),
            ),
            TextButton(
              child: const Text('Déconnecter'),
              onPressed: () async {
                Navigator.of(context).pop();
                await Supabase.instance.client.auth.signOut();
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (route) => false
                );
              },
            ),
          ],
        );
      },
    );
  }
}

