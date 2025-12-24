import { FormControl, Validators } from '@angular/forms';
import { ProductValidators } from './ProductValidators';

export type BaseProductForm = {
  productName: FormControl<string>;
  unitPrice: FormControl<number>;
  categoryId: FormControl<number | null>;
};

export function baseProductForm(): BaseProductForm {
  return {
    productName: new FormControl<string>('', { 
      nonNullable: true, 
      validators: ProductValidators.productName() 
    }),
    unitPrice: new FormControl<number>(0, { 
      nonNullable: true, 
      validators: ProductValidators.unitPrice() 
    }),
    categoryId: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: ProductValidators.categoryId(),
    }),//API'da test için nullable oldugu icin nonNullable false
  };
}

