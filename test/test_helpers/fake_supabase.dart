class FakeUser {
  final String id;
  FakeUser(this.id);
}

class FakeSupabaseAuth {
  FakeUser? currentUser;
}

class FakeSupabaseClient {
  final FakeSupabaseAuth auth = FakeSupabaseAuth();
  final List<Map<String, dynamic>> tasks = [];
  final List<Map<String, dynamic>> appointments = [];

  FakeTable from(String table) => FakeTable(this, table);
}

class FakeTable {
  final FakeSupabaseClient client;
  final String table;
  FakeTable(this.client, this.table);

  FakeFilter select() {
    return FakeFilter(_data);
  }

  FakeFilter insert(Map<String, dynamic> data) {
    final newMap = Map<String, dynamic>.from(data);
    newMap['id'] ??= DateTime.now().millisecondsSinceEpoch.toString();
    _data.add(newMap);
    return FakeFilter([newMap]);
  }

  FakeFilter update(Map<String, dynamic> data) {
    return FakeFilter(_data, updateData: data);
  }

  FakeFilter delete() {
    return FakeFilter(_data, delete: true);
  }

  List<Map<String, dynamic>> get _data =>
      table == 'tasks' ? client.tasks : client.appointments;
}

class FakeFilter implements Future<List<Map<String, dynamic>>> {
  List<Map<String, dynamic>> table;
  Map<String, dynamic>? filter;
  Map<String, dynamic>? updateData;
  bool delete;
  bool _single = false;

  FakeFilter(this.table, {this.updateData, this.delete = false});

  FakeFilter select() => this;

  FakeFilter single() {
    _single = true;
    return this;
  }

  FakeFilter eq(String column, dynamic value) {
    if (delete) {
      table.removeWhere((row) => row[column] == value);
    } else if (updateData != null) {
      final index = table.indexWhere((row) => row[column] == value);
      if (index != -1) {
        table[index] = {...table[index], ...updateData!};
      }
    } else {
      filter = {column: value};
    }
    return this;
  }

  Future<List<Map<String, dynamic>>> _resolve() async {
    var result = table;
    if (filter != null) {
      result = result
          .where((row) => row[filter!.keys.first] == filter!.values.first)
          .toList();
    }
    if (_single) {
      if (result.isEmpty) throw Exception('No rows');
      return [result.first];
    }
    return result;
  }

  @override
  Stream<List<Map<String, dynamic>>> asStream() => _resolve().asStream();

  @override
  Future<List<Map<String, dynamic>>> catchError(Function onError,
          {bool Function(Object)? test}) =>
      _resolve().catchError(onError, test: test);

  @override
  Future<R> then<R>(FutureOr<R> Function(List<Map<String, dynamic>> value) onValue,
          {Function? onError}) =>
      _resolve().then(onValue, onError: onError);

  @override
  Future<List<Map<String, dynamic>>> timeout(Duration timeLimit,
          {FutureOr<List<Map<String, dynamic>>> Function()? onTimeout}) =>
      _resolve().timeout(timeLimit, onTimeout: onTimeout);

  @override
  Future<List<Map<String, dynamic>>> whenComplete(FutureOr Function() action) =>
      _resolve().whenComplete(action);
}
