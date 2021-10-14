import { Subject, Subscription } from 'rxjs';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { Exercise } from '../exercise.model';
import { TrainingService } from '../training.service';
import { UIService } from 'src/app/shared/ui.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-new-training',
  templateUrl: './new-training.component.html',
  styleUrls: ['./new-training.component.css'],
})
export class NewTrainingComponent implements OnInit, OnDestroy {
  exercises: Exercise[];
  private unsubscribe: Subject<void> = new Subject();
  isLoading = true;
  constructor(
    private trainingService: TrainingService,
    private uiService: UIService
  ) {}

  ngOnInit(): void {
    this.uiService.loadingStateChanged
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((isLoading) => (this.isLoading = isLoading));
    // First we subscribe to the subject and then call fetchAvailableExercises that
    // fetch the data and updates the subject
    this.trainingService.exercisesChanged
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((newExercises) => {
        this.exercises = newExercises;
      });
    // We dont need to unsubscribe the subscription inside fetchAvailableExercises
    // because it will be replaced by a new one next time we reinitialize this component
    this.trainingService.fetchAvailableExercises();
  }

  fetchExercises() {
    this.trainingService.fetchAvailableExercises();
  }

  onStartTraining(form: NgForm) {
    this.trainingService.startExercise(form.value.exercise.id);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
