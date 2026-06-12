import '../../domain/entities/schedule_event.dart';
import '../../domain/repositories/schedule_repository.dart';
import '../datasources/local_schedule_data_source.dart';

/// Default repository backed by the local hardcoded routine. Maps DTOs to
/// domain entities and assigns stable ids.
class ScheduleRepositoryImpl implements ScheduleRepository {
  ScheduleRepositoryImpl(this._dataSource);

  final LocalScheduleDataSource _dataSource;

  @override
  Future<List<ScheduleEvent>> getTodaySchedule() async {
    final dtos = await _dataSource.getSchedule();
    return [
      for (var i = 0; i < dtos.length; i++) dtos[i].toEntity('evt_$i'),
    ];
  }
}
