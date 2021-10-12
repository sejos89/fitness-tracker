import { Subscription } from 'rxjs';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { Exercise } from '../exercise.model';
import { TrainingService } from '../training.service';

@Component({
  selector: 'app-new-training',
  templateUrl: './new-training.component.html',
  styleUrls: ['./new-training.component.css'],
})
export class NewTrainingComponent implements OnInit, OnDestroy {
  exercises: Exercise[];
  exerciseSubs: Subscription;
  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.exerciseSubs = this.trainingService.exercisesChanged.subscribe(
      (newExercises) => (this.exercises = newExercises)
    );
    // We dont need to unsubscribe the subscription inside fetchAvailableExercises
    // because it will be replaced by a new one next time we reinitialize this component
    this.trainingService.fetchAvailableExercises();
  }

  onStartTraining(form: NgForm) {
    this.trainingService.startExercise(form.value.exercise);
  }

  ngOnDestroy() {
    this.exerciseSubs.unsubscribe();
  }
}
