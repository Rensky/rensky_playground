'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { Search } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type PokemonData = {
    name: string;
    id: string;
    sprites: {
        back_default: string;
        front_default: string;
        other: {
            showdown: { front_default: string };
            'official-artwork': { front_default: string };
        };
    };
};

const Temp = () => {
    const fetchPokemon = async (id: string) => {
        try {
            const pokemonName = await ky.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`).json();
            return pokemonName;
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const { isPending, error, data } = useQuery({
        queryKey: ['pokemon'],
        queryFn: () => fetchPokemon('1'),
    });

    return (
        <>
            <div>123</div>
        </>
    );
};

const TempContainer = () => {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <Temp />
        </QueryClientProvider>
    );
};

export default TempContainer;
