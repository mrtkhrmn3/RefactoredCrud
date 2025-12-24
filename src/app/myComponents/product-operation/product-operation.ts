import { Component, signal, inject, OnInit } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ProductApi } from '../../DataAccess/product-api';
import { CategoryApi } from '../../DataAccess/category-api';
import { ProductResponseModel } from '../../Models/Products/ProductResponseModel';
import { CategoryResponseModel } from '../../Models/Categories/CategoryResponseModel';
import {
  createProductForm,
  toCreateProductRequest,
} from '../../Validations/Products/CreateProductFormFactory';
import {
  updateProductForm,
  toUpdateProductRequest,
} from '../../Validations/Products/UpdateProductFormFactory';

@Component({
  selector: 'app-product-operation',
  imports: [ReactiveFormsModule],
  templateUrl: './product-operation.html',
  styleUrl: './product-operation.css',
})
export class ProductOperation implements OnInit {
  private productApi = inject(ProductApi);
  private categoryApi = inject(CategoryApi);

  protected products = signal<ProductResponseModel[]>([]);
  protected categories = signal<CategoryResponseModel[]>([]);
  protected selectedProduct = signal<ProductResponseModel | null>(null);

  protected createForm = createProductForm();
  protected updateForm = updateProductForm();

  private async refreshProducts(): Promise<void> {
    try {
      const values = await this.productApi.getAll();
      this.products.set(values);
    } catch (error) {
      console.log('Ürün listesi alınamadı:', error);
    }
  }

  private async refreshCategories(): Promise<void> {
    try {
      const values = await this.categoryApi.getAll();
      this.categories.set(values);
    } catch (error) {
      console.log('Kategori listesi alınamadı:', error);
    }
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.refreshProducts(), this.refreshCategories()]);
  }

  async onCreate(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const req = toCreateProductRequest(this.createForm);
    await this.productApi.create(req);
    this.createForm.reset();
    await this.refreshProducts();
  }

  startUpdate(product: ProductResponseModel) {
    this.selectedProduct.set(product);

    this.updateForm.patchValue(
      {
        id: product.id,
        productName: product.productName,
        unitPrice: product.unitPrice,
        categoryId: product.categoryId,
      },
      { emitEvent: false }
    );
  }

  cancelUpdate() {
    this.selectedProduct.set(null);
    this.updateForm.reset({ id: 0, productName: '', unitPrice: 0, categoryId: null });
  }

  async onUpdate() {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const req = toUpdateProductRequest(this.updateForm);
    await this.productApi.update(req);
    this.cancelUpdate();
    await this.refreshProducts();
  }

  async onDelete(id: number): Promise<void> {
    const confirmDelete = window.confirm(
      `Id'si ${id} olan ürünü silmek istediginize emin misiniz?`
    );

    if (!confirmDelete) return;

    try {
      const message = await this.productApi.deleteById(id);
      console.log('Delete mesajı', message);

      this.products.update((x) => x.filter((p) => p.id !== id));

      const selected = this.selectedProduct();
      if (selected && selected.id === id) {
        this.selectedProduct.set(null);
      }
    } catch (error) {
      console.log(error);
    }
  }

  protected labels: Record<string, string> = {
    productName: 'Ürün Adı',
    unitPrice: 'Birim Fiyat',
    categoryId: 'Kategori',
    id: 'Id',
  };

  protected getErrorMessage(control: AbstractControl | null, label = 'Bu alan'): string | null {
    if (!control || (!control.touched && !control.dirty) || !control.invalid) return null;
    else if (control.hasError('required')) return `${label} zorunludur`;
    else if (control.hasError('minlength')) {
      const e = control.getError('minlength');
      return `${label} en az ${e.requiredLength} karakter olmalıdır`;
    } else if (control.hasError('maxlength')) {
      const e = control.getError('maxlength');
      return `${label} en fazla ${e.requiredLength} karakter olmalıdır`;
    } else if (control.hasError('min')) {
      const e = control.getError('min');
      return `${label} en az ${e.min} olmalıdır`;
    }

    return `${label} geçersiz`;
  }

  protected getErrorMessageByName(
    form: { controls: Record<string, AbstractControl> },
    controlName: string
  ): string | null {
    const control = form.controls[controlName];
    const label = this.labels[controlName] ?? controlName;

    return this.getErrorMessage(control, label);
  }
}
