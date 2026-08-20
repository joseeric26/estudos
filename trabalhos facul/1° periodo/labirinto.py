"""Gera e exibe um labirinto aleatório em ASCII.

Use:
  python labirinto.py [largura] [altura]
  python labirinto.py labirinto.txt

Exemplo:
  python labirinto.py 15 11
  python labirinto.py labirinto.txt
"""

import random
import sys

DIRECTIONS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

class Labirinto:
    def __init__(self, largura=21, altura=11):
        if largura % 2 == 0:
            largura += 1
        if altura % 2 == 0:
            altura += 1
        self.largura = largura
        self.altura = altura
        self.mapa = [['#' for _ in range(self.largura)] for _ in range(self.altura)]
        self._gerar()

    @classmethod
    def from_file(cls, caminho):
        with open(caminho, 'r', encoding='utf-8') as arquivo:
            linhas = [line.rstrip('\n') for line in arquivo]
        altura = len(linhas)
        largura = max((len(linha) for linha in linhas), default=0)
        mapa = [list(linha.ljust(largura, '#')) for linha in linhas]
        obj = cls.__new__(cls)
        obj.largura = largura
        obj.altura = altura
        obj.mapa = mapa
        return obj

    def _gerar(self):
        def passo(x, y):
            self.mapa[y][x] = ' '
            direcoes = DIRECTIONS.copy()
            random.shuffle(direcoes)
            for dx, dy in direcoes:
                nx, ny = x + dx * 2, y + dy * 2
                if 0 < nx < self.largura - 1 and 0 < ny < self.altura - 1:
                    if self.mapa[ny][nx] == '#':
                        self.mapa[y + dy][x + dx] = ' '
                        passo(nx, ny)
        passo(1, 1)
        self.mapa[0][1] = ' '
        self.mapa[self.altura - 1][self.largura - 2] = ' '

    def imprimir(self, mapa=None):
        if mapa is None:
            mapa = self.mapa
        for linha in mapa:
            print(''.join(linha))

    def salvar(self, caminho, mapa=None):
        if mapa is None:
            mapa = self.mapa
        with open(caminho, 'w', encoding='utf-8') as arquivo:
            for linha in mapa:
                arquivo.write(''.join(linha) + '\n')

    def _vizinhos(self, x, y):
        for dx, dy in DIRECTIONS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.largura and 0 <= ny < self.altura:
                yield nx, ny

    def encontrar_entrada_saida(self):
        entradas = [(x, 0) for x in range(self.largura) if self.mapa[0][x] != '#']
        saidas = [(x, self.altura - 1) for x in range(self.largura) if self.mapa[self.altura - 1][x] != '#']
        if entradas and saidas:
            return entradas[0], saidas[-1]

        entradas = [(0, y) for y in range(self.altura) if self.mapa[y][0] != '#']
        saidas = [(self.largura - 1, y) for y in range(self.altura) if self.mapa[y][self.largura - 1] != '#']
        if entradas and saidas:
            return entradas[0], saidas[-1]

        raise ValueError('Não foi possível encontrar entrada e saída no labirinto.')

    def resolver(self, inicio=None, fim=None):
        if inicio is None or fim is None:
            inicio, fim = self.encontrar_entrada_saida()

        fila = [inicio]
        visitado = {inicio: None}

        while fila:
            x, y = fila.pop(0)
            if (x, y) == fim:
                break
            for nx, ny in self._vizinhos(x, y):
                if self.mapa[ny][nx] != '#' and (nx, ny) not in visitado:
                    visitado[(nx, ny)] = (x, y)
                    fila.append((nx, ny))

        if fim not in visitado:
            return None

        caminho = []
        atual = fim
        while atual is not None:
            caminho.append(atual)
            atual = visitado[atual]
        caminho.reverse()
        return caminho

    def mapa_com_caminho(self):
        caminho = self.resolver()
        if caminho is None:
            return None

        mapa_resolvido = [linha.copy() for linha in self.mapa]
        for x, y in caminho[1:-1]:
            mapa_resolvido[y][x] = '.'

        inicio, fim = caminho[0], caminho[-1]
        mapa_resolvido[inicio[1]][inicio[0]] = 'S'
        mapa_resolvido[fim[1]][fim[0]] = 'E'
        return mapa_resolvido


def main():
    if len(sys.argv) == 2:
        caminho = sys.argv[1]
        try:
            labirinto = Labirinto.from_file(caminho)
        except FileNotFoundError:
            print(f'Arquivo não encontrado: {caminho}')
            sys.exit(1)
        print(f'Labirinto carregado de {caminho}:')
        arquivo_saida = caminho
        arquivo_resolvido = f'resolvido_{caminho}'
    else:
        largura = 21
        altura = 11
        if len(sys.argv) >= 3:
            try:
                largura = int(sys.argv[1])
                altura = int(sys.argv[2])
            except ValueError:
                print('Os dois argumentos devem ser números inteiros.')
                sys.exit(1)
        labirinto = Labirinto(largura, altura)
        print('Labirinto gerado:')
        arquivo_saida = 'labirinto.txt'
        arquivo_resolvido = 'labirinto_resolvido.txt'

    labirinto.imprimir()
    labirinto.salvar(arquivo_saida)
    print(f'Labirinto salvo em {arquivo_saida}')

    mapa_resolvido = labirinto.mapa_com_caminho()
    if mapa_resolvido is not None:
        print('\nLabirinto resolvido pela IA:')
        labirinto.imprimir(mapa_resolvido)
        labirinto.salvar(arquivo_resolvido, mapa_resolvido)
        print(f'Labirinto resolvido salvo em {arquivo_resolvido}')
    else:
        print('\nNão foi possível resolver o labirinto.')


if __name__ == '__main__':
    main()
