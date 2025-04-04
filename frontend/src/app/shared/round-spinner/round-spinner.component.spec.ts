import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundSpinnerComponent } from './round-spinner.component';

describe('RoundSpinnerComponent', () => {
  let component: RoundSpinnerComponent;
  let fixture: ComponentFixture<RoundSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoundSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RoundSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
