import { Inject } from '@nestjs/common';
import { CommandHandler } from '@nestjs/cqrs';
import { CreateLeaveRequestCommand } from './CreateLeaveRequestCommand';
import { ILeaveRequestRepository } from 'src/Domain/HumanResource/Leave/Repository/ILeaveRequestRepository';
import { LeaveRequest } from 'src/Domain/HumanResource/Leave/LeaveRequest.entity';
import { DoesLeaveRequestExistForPeriod } from 'src/Domain/HumanResource/Leave/Specification/DoesLeaveRequestExistForPeriod';
import { LeaveRequestAlreadyExistForThisPeriodException } from 'src/Domain/HumanResource/Leave/Exception/LeaveRequestAlreadyExistForThisPeriodException';
import { DoesLeaveExistForPeriod } from 'src/Domain/FairCalendar/Specification/DoesLeaveExistForPeriod';
import { EventsOrLeavesAlreadyExistForThisPeriodException } from 'src/Domain/FairCalendar/Exception/EventsOrLeavesAlreadyExistForThisPeriodException';
import { IMattermostNotifier } from 'src/Application/IMattermostNotifier';
import { ICommandBus } from 'src/Application/ICommandBus';
import { CreateNotificationCommand } from 'src/Application/Notification/Command/CreateNotificationCommand';
import { NotificationType } from 'src/Domain/Notification/Notification.entity';

@CommandHandler(CreateLeaveRequestCommand)
export class CreateLeaveRequestCommandHandler {
  constructor(
    @Inject('ILeaveRequestRepository')
    private readonly leaveRequestRepository: ILeaveRequestRepository,
    @Inject('ICommandBus')
    private readonly commandBus: ICommandBus,
    private readonly doesLeaveRequestExistForPeriod: DoesLeaveRequestExistForPeriod,
    private readonly doesLeaveExistForPeriod: DoesLeaveExistForPeriod,
  ) {}

  public async execute(command: CreateLeaveRequestCommand): Promise<string> {
    const {
      user,
      endDate,
      endsAllDay,
      type,
      startDate,
      startsAllDay,
      comment
    } = command;

    if (
      true ===
      (await this.doesLeaveRequestExistForPeriod.isSatisfiedBy(
        user,
        startDate,
        endDate
      ))
    ) {
      throw new LeaveRequestAlreadyExistForThisPeriodException();
    }

    if (
      true ===
      (await this.doesLeaveExistForPeriod.isSatisfiedBy(
        user,
        startDate,
        endDate
      ))
    ) {
      throw new EventsOrLeavesAlreadyExistForThisPeriodException();
    }

    const leaveRequest = await this.leaveRequestRepository.save(
      new LeaveRequest(
        user,
        type,
        startDate,
        startsAllDay,
        endDate,
        endsAllDay,
        comment
      )
    );

    this.commandBus.execute(
      new CreateNotificationCommand(
        NotificationType.POST,
        'Demande de congés',
        leaveRequest
      )
    );

    return leaveRequest.getId();
  }
}
