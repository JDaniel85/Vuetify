<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h6 mb-4">
            {{ isEdit ? 'Editar Producto' : 'Nuevo Producto' }}
          </v-card-title>
          <!-- Skeleton mientras carga el producto a editar -->
          <template v-if="loadingData">
            <v-skeleton-loader type="text" class="mb-3" />
            <v-skeleton-loader type="text" class="mb-3" />
            <v-skeleton-loader type="text" class="mb-3" />
            <v-skeleton-loader type="text" class="mb-3" />
          </template>

          <v-form v-else @submit.prevent="saveProduct">
            <v-text-field v-model="product.codigo" label="Código" variant="outlined" density="comfortable" class="mb-3" required />
            <v-text-field v-model="product.nombre" label="Nombre" variant="outlined" density="comfortable" class="mb-3" required />
            <v-text-field v-model="product.precio" label="Precio" type="number" variant="outlined" density="comfortable" class="mb-3" required />
            <v-text-field v-model="product.porcentaje_impuesto" label="% Impuesto" type="number" variant="outlined" density="comfortable" class="mb-3" required />
            <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-3">{{ errorMsg }}</v-alert>
            <v-row class="mt-2">
              <v-col cols="6">
                <v-btn color="primary" block :loading="saving" @click="saveProduct">
                  <v-icon start>mdi-content-save</v-icon>Guardar
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn color="secondary" block @click="cancel">
                  <v-icon start>mdi-arrow-left</v-icon>Cancelar
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from '../config/axios';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const saving = ref(false);
const loadingData = ref(false);
const errorMsg = ref('');

const product = ref({
  codigo: '',
  nombre: '',
  precio: '',
  porcentaje_impuesto: ''
});

// Si viene con ?id=X es edicion
const isEdit = computed(() => !!route.query.id);
const productId = computed(() => route.query.id);

onMounted(async () => {
  if (isEdit.value) {
    loadingData.value = true;
    try {
      const res = await axios.get(`/products/${productId.value}`);
      const data = res.data.data ?? res.data;
      product.value = {
        codigo: data.codigo,
        nombre: data.nombre,
        precio: data.precio,
        porcentaje_impuesto: data.porcentaje_impuesto
      };
    } catch (e) {
      errorMsg.value = 'No se pudieron cargar los datos del producto.';
    } finally {
      loadingData.value = false;
    }
  }
});

const saveProduct = async () => {
  saving.value = true;
  errorMsg.value = '';
  try {
    if (isEdit.value) {
      await axios.put(`/products/${productId.value}`, product.value);
    } else {
      await axios.post('/products', product.value);
    }
    router.push('/Products');
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message ?? 'Error al guardar el producto.';
  }
  saving.value = false;
};

const cancel = () => {
  router.push('/Products');
};
</script>
