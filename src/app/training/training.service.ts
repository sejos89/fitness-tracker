import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { Exercise } from './exercise.model';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  exerciseChanged: Subject<Exercise> = new Subject();
  exercisesChanged: Subject<Exercise[]> = new Subject();
  finishedExercisesChanged: Subject<Exercise[]> = new Subject();
  private availableExercises: Exercise[] = [];

  private runningExercise: Exercise;
  private exercises: Exercise[] = [];
  fbSubs: Subscription;

  constructor(private readonly db: AngularFirestore) {}
  fetchAvailableExercises() {
    this.db
      .collection('available exercises')
      .snapshotChanges()
      .pipe(
        map((docArray) =>
          docArray.map((doc) => {
            return {
              id: doc.payload.doc.id,
              name: doc.payload.doc.data()['name'],
              calories: doc.payload.doc.data()['calories'],
              duration: doc.payload.doc.data()['duration'],
            };
          })
        )
      )
      .subscribe((exercises: Exercise[]) => {
        this.availableExercises = exercises;
        this.exercisesChanged.next([...this.availableExercises]);
      });
  }

  startExercise(selectedId: string) {
    this.runningExercise = this.availableExercises.find(
      (ex) => ex.id === selectedId
    );
    this.exerciseChanged.next({ ...this.runningExercise });
  }

  completeExercise() {
    this.addDataToDatabase({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed',
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDatabase({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled',
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  fetchCompletedOrCancelledExercises() {
    console.log('hola desde fetchcomplete');
    if (!this.fbSubs) {
      this.fbSubs = this.db
        .collection('finishedExercises')
        .valueChanges()
        // .pipe(debounceTime(500))
        .subscribe((exercises: Exercise[]) => {
          console.log('hola desde fetchcomplete subs');
          this.finishedExercisesChanged.next(exercises);
        });
    }
  }

  getRunningExercise() {
    return { ...this.runningExercise };
  }

  private addDataToDatabase(exercise: Exercise) {
    this.db.collection('finishedExercises').add(exercise);
  }

  //   cancelSubscriptions() {
  //     this.fbSubs.forEach((sub) => sub.unsubscribe());
  //   }
}
