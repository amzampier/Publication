<script setup lang="ts">
import { MapPin, MapPinCheck, LoaderCircle } from '@lucide/vue'
import { useBuscaCep } from '../../composables/useBuscaCep'
import { UFS, REGIOES } from '../../config/brasil'
import type { EnderecoUsuario } from '../usuarios/useUsuariosModelo'

// Mesmo contrato do modal de Gestão de Usuários (seção Endereço) — o objeto
// endereco é do rascunho compartilhado da página.

interface Props {
  endereco: EnderecoUsuario
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

// --- CEP: busca ViaCEP real (capability busca-cep) ---
// Getter porque a página troca a referência de rascunho ao cancelar/salvar
const { carregando: carregandoCep, buscar } = useBuscaCep(
  () => props.endereco,
  'Meu Perfil'
)

const buscarCep = async () => {
  const mudou = await buscar()
  if (mudou) aoEditar()
}

const aoEditar = () => emit('change')
</script>

<template>
  <div class="grid gap-y-6">
    <section>
      <h2 class="text-sm font-bold text-slate-900">Endereço</h2>
      <p class="mt-0.5 text-xs text-slate-500">
        Mantenha seu endereço sempre atualizado.
      </p>
      <!-- Filete verde da marca separando o cabeçalho dos campos -->
      <div class="mt-3 h-px bg-brand-accent" aria-hidden="true" />
      <div class="mt-4 grid gap-x-4 gap-y-[11px] sm:grid-cols-12">
        <div class="flex items-end gap-2 sm:col-span-3">
          <UiInput
            v-model="endereco.cep"
            class="min-w-0 flex-1"
            label="CEP"
            mask="99999-999"
            placeholder="00000-000"
            @update:model-value="aoEditar"
          />
          <UiTooltip content="Buscar CEP (ViaCEP)" position="top">
            <span
              role="button"
              tabindex="0"
              aria-label="Buscar CEP (ViaCEP)"
              :aria-busy="carregandoCep ? 'true' : undefined"
              :class="[
                'mb-[1px] flex h-[34px] w-5 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-brand-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus',
                carregandoCep
                  ? 'pointer-events-none'
                  : 'cursor-pointer'
              ]"
              @click="buscarCep"
              @keydown.enter.prevent="buscarCep"
            >
              <LoaderCircle
                v-if="carregandoCep"
                class="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
              <MapPinCheck v-else class="h-4 w-4" aria-hidden="true" />
            </span>
          </UiTooltip>
        </div>
        <UiInput
          v-model="endereco.logradouro"
          class="sm:col-span-5"
          label="Endereço"
          placeholder="Rua, avenida..."
          @update:model-value="aoEditar"
        />
        <UiInput
          v-model="endereco.numero"
          class="sm:col-span-2"
          label="Número"
          placeholder="123"
          @update:model-value="aoEditar"
        />
        <UiInput
          v-model="endereco.complemento"
          class="sm:col-span-2"
          label="Complemento"
          placeholder="Apto, bloco..."
          @update:model-value="aoEditar"
        />
        <UiInput
          v-model="endereco.bairro"
          class="sm:col-span-3"
          label="Bairro"
          placeholder="Bairro"
          @update:model-value="aoEditar"
        />
        <UiInput
          v-model="endereco.cidade"
          class="sm:col-span-4"
          label="Cidade"
          placeholder="Cidade"
          @update:model-value="aoEditar"
        />
        <UiSelect
          v-model="endereco.estado"
          class="sm:col-span-2"
          label="Estado"
          placeholder="Selecione o estado..."
          :options="UFS"
          @update:model-value="aoEditar"
        />
        <UiSelect
          v-model="endereco.regiao"
          class="sm:col-span-3"
          label="Região"
          placeholder="Selecione a região..."
          :options="REGIOES"
          @update:model-value="aoEditar"
        />
      </div>
    </section>
  </div>
</template>
