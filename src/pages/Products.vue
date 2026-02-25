<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-btn color="primary" class="mb-4" @click="goToNewProduct" prepend-icon="mdi-plus">Nuevo registro</v-btn>
        <v-data-table :headers="headers" :items="products" :loading="loading" loading-text="Cargando registros..." no-data-text="No hay registros disponibles" item-key="codigo" class="elevation-1">
          <template v-slot:item.porcentaje_impuesto="{ item }">
            {{ item.porcentaje_impuesto }} %
          </template>
          <template v-slot:item.acciones="{ item }">
            <v-btn icon size="small" color="blue" variant="text" @click="editProduct(item)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon size="small" color="red" variant="text" @click="confirmDelete(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>

  <!-- Dialogo de confirmacion de eliminacion -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Eliminar registro</v-card-title>
      <v-card-text>¿Estás seguro que deseas eliminar <strong>{{ productToDelete?.nombre }}</strong>? Esta acción no se puede deshacer.</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
        <v-btn color="red" variant="flat" :loading="deleting" @click="deleteProduct">Eliminar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from '../config/axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const products = ref([]);
const headers = [
  { title: 'Código', key: 'codigo' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Precio ($)', key: 'precio' },
  { title: '% Impuesto', key: 'porcentaje_impuesto' },
  { title: 'Precio Final ($)', key: 'precio_final' },
  { title: 'Acciones', key: 'acciones', sortable: false }
];

const loading = ref(false);
const deleteDialog = ref(false);
const deleting = ref(false);
const productToDelete = ref<any>(null);

const goToNewProduct = () => {
  router.push('/ProductForm');
};

const editProduct = (item: any) => {
  router.push({ path: '/ProductForm', query: { id: item.id } });
};

const confirmDelete = (item: any) => {
  productToDelete.value = item;
  deleteDialog.value = true;
};

const deleteProduct = async () => {
  deleting.value = true;
  try {
    await axios.delete(`/products/${productToDelete.value.id}`);
    products.value = (products.value as any[]).filter((p: any) => p.id !== productToDelete.value.id);
    deleteDialog.value = false;
  } catch (e) {
    // Manejo de error
  }
  deleting.value = false;
};

const loadProducts = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/products');
    products.value = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  } catch (e) {
    // Manejo de error
  } finally {
    loading.value = false;
  }
};

onMounted(loadProducts);
</script>
